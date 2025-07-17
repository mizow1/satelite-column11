import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SiteCrawler } from '@/lib/site-crawler'

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
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.url) {
      return NextResponse.json(
        { error: 'サイトURLが設定されていません' },
        { status: 400 }
      )
    }

    const crawler = new SiteCrawler()
    const crawlResult = await crawler.crawlSite(site.url)

    if (crawlResult.error) {
      return NextResponse.json(
        { error: crawlResult.error },
        { status: 500 }
      )
    }

    // 既存のURLを削除
    await prisma.siteUrl.deleteMany({
      where: { siteId: params.id }
    })

    // 新しいURLを保存
    const siteUrls = await Promise.all(
      crawlResult.urls.map(async (url) => {
        return prisma.siteUrl.create({
          data: {
            siteId: params.id,
            url,
            isActive: true
          }
        })
      })
    )

    return NextResponse.json({
      message: `${siteUrls.length}個のURLを取得しました`,
      urls: siteUrls
    })
  } catch (error) {
    console.error('Error crawling site:', error)
    return NextResponse.json(
      { error: 'サイトクロール中にエラーが発生しました' },
      { status: 500 }
    )
  }
}