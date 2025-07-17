import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSiteSchema = z.object({
  name: z.string().min(1, 'サイト名を入力してください').optional(),
  url: z.string().url('有効なURLを入力してください').optional(),
  siteImage: z.string().optional(),
  contentPolicy: z.string().optional(),
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
      },
      include: {
        siteUrls: {
          orderBy: { createdAt: 'desc' }
        },
        articleOutlines: {
          include: {
            articles: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Error fetching site:', error)
    return NextResponse.json(
      { error: 'サイト情報の取得中にエラーが発生しました' },
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
    const updateData = updateSiteSchema.parse(body)

    const existingSite = await prisma.site.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const site = await prisma.site.update({
      where: { id: params.id },
      data: updateData,
      include: {
        siteUrls: true,
        articleOutlines: {
          include: {
            articles: true
          }
        }
      }
    })

    return NextResponse.json(site)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating site:', error)
    return NextResponse.json(
      { error: 'サイト更新中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingSite = await prisma.site.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    await prisma.site.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'サイトが削除されました' })
  } catch (error) {
    console.error('Error deleting site:', error)
    return NextResponse.json(
      { error: 'サイト削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}