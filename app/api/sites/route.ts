import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSiteSchema = z.object({
  name: z.string().min(1, 'サイト名を入力してください'),
  url: z.string().url('有効なURLを入力してください').optional(),
  siteImage: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sites = await prisma.site.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        siteUrls: true,
        articleOutlines: {
          include: {
            articles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json(
      { error: 'サイト一覧の取得中にエラーが発生しました' },
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
    const { name, url, siteImage } = createSiteSchema.parse(body)

    const site = await prisma.site.create({
      data: {
        name,
        url,
        siteImage,
        userId: session.user.id,
      },
      include: {
        siteUrls: true,
        articleOutlines: true
      }
    })

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating site:', error)
    return NextResponse.json(
      { error: 'サイト作成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}