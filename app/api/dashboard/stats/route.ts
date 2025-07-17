import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TokenManagerImpl } from '@/lib/ai/token-manager'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenManager = new TokenManagerImpl()

    // 並列でデータを取得
    const [
      sitesCount,
      outlinesCount,
      articlesCount,
      totalTokens,
      monthlyTokens,
      userSettings
    ] = await Promise.all([
      prisma.site.count({
        where: { userId: session.user.id }
      }),
      prisma.articleOutline.count({
        where: {
          site: { userId: session.user.id }
        }
      }),
      prisma.article.count({
        where: {
          outline: {
            site: { userId: session.user.id }
          }
        }
      }),
      tokenManager.getTotalUsage(session.user.id),
      tokenManager.getMonthlyUsage(session.user.id),
      prisma.userSettings.findUnique({
        where: { userId: session.user.id }
      })
    ])

    return NextResponse.json({
      sitesCount,
      outlinesCount,
      articlesCount,
      totalTokens,
      monthlyTokens,
      tokenLimit: userSettings?.tokenLimitMonthly || 100000
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'ダッシュボード統計の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}