import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TokenManagerImpl } from '@/lib/ai/token-manager'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenManager = new TokenManagerImpl()
    const dailyUsage = await tokenManager.getDailyUsage(session.user.id, 30)

    return NextResponse.json(dailyUsage)

  } catch (error) {
    console.error('Error fetching daily usage:', error)
    return NextResponse.json(
      { error: '日別使用量データの取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}