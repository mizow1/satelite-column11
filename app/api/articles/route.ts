import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIServiceFactory } from '@/lib/ai/ai-factory'
import { TokenManagerImpl } from '@/lib/ai/token-manager'
import { z } from 'zod'

const generateArticleSchema = z.object({
  outlineId: z.string(),
  language: z.string(),
  userInstructions: z.string().optional(),
})

const bulkGenerateSchema = z.object({
  outlineIds: z.array(z.string()),
  languages: z.array(z.string()),
  userInstructions: z.string().optional(),
})

const rateArticleSchema = z.object({
  articleId: z.string(),
  rating: z.number().min(1).max(100),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const siteId = searchParams.get('siteId')
    const outlineId = searchParams.get('outlineId')

    let whereClause: any = {}

    if (siteId) {
      whereClause = {
        outline: {
          site: {
            userId: session.user.id,
            id: siteId
          }
        }
      }
    } else if (outlineId) {
      whereClause = {
        outlineId,
        outline: {
          site: {
            userId: session.user.id
          }
        }
      }
    } else {
      whereClause = {
        outline: {
          site: {
            userId: session.user.id
          }
        }
      }
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        outline: {
          include: {
            site: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: '記事の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { outlineId, language, userInstructions } = generateArticleSchema.parse(body)

    const outline = await prisma.articleOutline.findFirst({
      where: {
        id: outlineId,
        site: {
          userId: session.user.id
        }
      }
    })

    if (!outline) {
      return NextResponse.json({ error: 'Outline not found' }, { status: 404 })
    }

    // 既に同じ言語の記事が存在するかチェック
    const existingArticle = await prisma.article.findFirst({
      where: {
        outlineId,
        language
      }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'この言語の記事は既に存在します' },
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

    // AIサービスを取得
    const aiService = AIServiceFactory.createService(userSettings.aiService)

    // 記事概要情報を準備
    const articleOutline = {
      title: outline.title,
      outline: outline.outline,
      seoKeywords: outline.seoKeywords ? outline.seoKeywords.split(',') : []
    }

    // 記事を生成
    const content = await aiService.generateArticleContent(
      articleOutline,
      language,
      userInstructions
    )

    // データベースに保存
    const article = await prisma.article.create({
      data: {
        outlineId,
        language,
        content,
        userInstructions
      },
      include: {
        outline: {
          include: {
            site: true
          }
        }
      }
    })

    // トークン使用量を記録
    const tokensUsed = await aiService.getTokenUsage()
    await tokenManager.recordUsage(session.user.id, userSettings.aiService, tokensUsed)

    return NextResponse.json({
      article,
      tokensUsed
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error generating article:', error)
    return NextResponse.json(
      { error: '記事生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { articleId, rating } = rateArticleSchema.parse(body)

    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        outline: {
          site: {
            userId: session.user.id
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { userRating: rating },
      include: {
        outline: {
          include: {
            site: true
          }
        }
      }
    })

    return NextResponse.json(updatedArticle)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error rating article:', error)
    return NextResponse.json(
      { error: '記事評価中にエラーが発生しました' },
      { status: 500 }
    )
  }
}