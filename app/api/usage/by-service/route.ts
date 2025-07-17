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
    const serviceUsage = await tokenManager.getUsageByService(session.user.id)

    return NextResponse.json(serviceUsage)

  } catch (error) {
    console.error('Error fetching service usage:', error)
    return NextResponse.json(
      { error: 'サービス別使用量データの取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}