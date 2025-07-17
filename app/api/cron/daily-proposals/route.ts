import { NextRequest, NextResponse } from 'next/server'
import { DailyProposalService } from '@/lib/content/daily-proposal'

export async function GET(req: NextRequest) {
  try {
    // Vercel Cronジョブまたは外部cronサービスからの実行を想定
    // 認証ヘッダーをチェック（本番環境では必須）
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dailyProposalService = new DailyProposalService()
    await dailyProposalService.generateAndSendDailyProposals()

    return NextResponse.json({
      success: true,
      message: '日次提案の送信が完了しました',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Daily proposals cron job error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '日次提案処理中にエラーが発生しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // 手動実行用のエンドポイント（管理者専用）
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, siteId } = body

    const dailyProposalService = new DailyProposalService()

    if (userId && siteId) {
      // 特定ユーザー・サイトに対して実行
      await dailyProposalService.generateProposalsForUser(userId, siteId)
      return NextResponse.json({
        success: true,
        message: `ユーザー ${userId} のサイト ${siteId} に提案を送信しました`,
        timestamp: new Date().toISOString()
      })
    } else {
      // 全ユーザーに対して実行
      await dailyProposalService.generateAndSendDailyProposals()
      return NextResponse.json({
        success: true,
        message: '全ユーザーに日次提案を送信しました',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Manual daily proposals error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '処理中にエラーが発生しました',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}