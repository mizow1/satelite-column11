import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateArticleSchema = z.object({
  content: z.string().optional(),
  userInstructions: z.string().optional(),
  userRating: z.number().min(1).max(100).optional(),
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

    const article = await prisma.article.findFirst({
      where: {
        id: params.id,
        outline: {
          site: {
            userId: session.user.id
          }
        }
      },
      include: {
        outline: {
          include: {
            site: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: '記事の取得中にエラーが発生しました' },
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
    const updateData = updateArticleSchema.parse(body)

    const existingArticle = await prisma.article.findFirst({
      where: {
        id: params.id,
        outline: {
          site: {
            userId: session.user.id
          }
        }
      }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const article = await prisma.article.update({
      where: { id: params.id },
      data: updateData,
      include: {
        outline: {
          include: {
            site: true
          }
        }
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: '記事更新中にエラーが発生しました' },
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

    const existingArticle = await prisma.article.findFirst({
      where: {
        id: params.id,
        outline: {
          site: {
            userId: session.user.id
          }
        }
      }
    })

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    await prisma.article.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '記事が削除されました' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: '記事削除中にエラーが発生しました' },
      { status: 500 }
    )
  }
}