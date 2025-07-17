import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIServiceFactory } from '@/lib/ai/ai-factory'
import { TokenManagerImpl } from '@/lib/ai/token-manager'

export async function POST(
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
      },
      include: {
        siteUrls: {
          where: { isActive: true }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
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

    // サイト情報を準備
    const siteInfo = {
      name: site.name,
      url: site.url || undefined,
      siteImage: site.siteImage || undefined,
      urls: site.siteUrls.map(siteUrl => siteUrl.url)
    }

    // コンテンツポリシーを生成
    const contentPolicy = await aiService.generateContentPolicy(siteInfo)

    // トークン使用量を記録
    const tokensUsed = await aiService.getTokenUsage()
    await tokenManager.recordUsage(session.user.id, userSettings.aiService, tokensUsed)

    // サイトにポリシーを保存
    const updatedSite = await prisma.site.update({
      where: { id: params.id },
      data: { contentPolicy },
      include: {
        siteUrls: true,
        articleOutlines: true
      }
    })

    return NextResponse.json({
      site: updatedSite,
      contentPolicy,
      tokensUsed
    })
  } catch (error) {
    console.error('Error generating content policy:', error)
    return NextResponse.json(
      { error: 'コンテンツポリシー生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}