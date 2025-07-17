import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIServiceFactory } from '@/lib/ai/ai-factory'
import { TokenManagerImpl } from '@/lib/ai/token-manager'
import { z } from 'zod'

const generateOutlinesSchema = z.object({
  count: z.number().min(1).max(20).default(10),
})

const rateOutlineSchema = z.object({
  outlineId: z.string(),
  rating: z.number().min(1).max(100),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const site = await prisma.site.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const outlines = await prisma.articleOutline.findMany({
      where: { siteId: params.id },
      include: {
        articles: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(outlines)
  } catch (error) {
    console.error('Error fetching outlines:', error)
    return NextResponse.json(
      { error: '記事概要の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { count } = generateOutlinesSchema.parse(body)

    const site = await prisma.site.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.contentPolicy) {
      return NextResponse.json(
        { error: 'まず記事作成方針を生成してください' },
        { status: 400 }
      )
    }

    // ユーザーの設定を取得
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!userSettings) {
      return NextResponse.json(
        { error: 'ユーザー設定が見つかりません' },
        { status: 400 }
      )
    }

    // トークン制限チェック
    const tokenManager = new TokenManagerImpl()
    const canUse = await tokenManager.checkLimit(session.user.id)
    
    if (!canUse) {
      return NextResponse.json(
        { error: '月間トークン制限に達しています' },
        { status: 429 }
      )
    }

    // 既存の記事概要を取得（重複回避のため）
    const existingOutlines = await prisma.articleOutline.findMany({
      where: { siteId: params.id },
      select: { title: true, outline: true, seoKeywords: true }
    })

    const aiOutlines = existingOutlines.map(outline => ({
      title: outline.title,
      outline: outline.outline,
      seoKeywords: outline.seoKeywords ? outline.seoKeywords.split(',') : []
    }))

    // AIサービスを取得
    const aiService = AIServiceFactory.createService(userSettings.aiService)

    // 記事概要を生成
    const generatedOutlines = await aiService.generateArticleOutlines(
      site.contentPolicy,
      count,
      aiOutlines
    )

    // データベースに保存
    const savedOutlines = await Promise.all(
      generatedOutlines.map(async (outline) => {
        return prisma.articleOutline.create({
          data: {
            siteId: params.id,
            title: outline.title,
            outline: outline.outline,
            seoKeywords: outline.seoKeywords.join(',')
          },
          include: {
            articles: true
          }
        })
      })
    )

    // トークン使用量を記録
    const tokensUsed = await aiService.getTokenUsage()
    await tokenManager.recordUsage(session.user.id, userSettings.aiService, tokensUsed)

    return NextResponse.json({
      outlines: savedOutlines,
      tokensUsed
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error generating outlines:', error)
    return NextResponse.json(
      { error: '記事概要生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { outlineId, rating } = rateOutlineSchema.parse(body)

    const site = await prisma.site.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const outline = await prisma.articleOutline.findFirst({
      where: {
        id: outlineId,
        siteId: params.id
      }
    })

    if (!outline) {
      return NextResponse.json({ error: 'Outline not found' }, { status: 404 })
    }

    const updatedOutline = await prisma.articleOutline.update({
      where: { id: outlineId },
      data: { userRating: rating },
      include: {
        articles: true
      }
    })

    return NextResponse.json(updatedOutline)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error rating outline:', error)
    return NextResponse.json(
      { error: '記事概要の評価中にエラーが発生しました' },
      { status: 500 }
    )
  }
}