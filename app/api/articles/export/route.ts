import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CSVExporter, ExportOptions } from '@/lib/export/csv-exporter'
import { z } from 'zod'

const exportSchema = z.object({
  articleIds: z.array(z.string()).optional(),
  siteId: z.string().optional(),
  format: z.enum(['standard', 'wordpress', 'drupal']).default('standard'),
  options: z.object({
    includeMetadata: z.boolean().default(true),
    includeContent: z.boolean().default(true),
    includeRatings: z.boolean().default(true)
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { articleIds, siteId, format, options } = exportSchema.parse(body)

    let whereClause: any = {
      outline: {
        site: {
          userId: session.user.id
        }
      }
    }

    if (articleIds && articleIds.length > 0) {
      whereClause.id = { in: articleIds }
    } else if (siteId) {
      whereClause.outline.siteId = siteId
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

    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートする記事が見つかりません' },
        { status: 404 }
      )
    }

    let csvContent: string
    let filename: string

    switch (format) {
      case 'wordpress':
        csvContent = CSVExporter.exportForWordPress(articles)
        filename = CSVExporter.generateFilename('articles', articles[0].outline.site.name, 'wordpress')
        break
      case 'drupal':
        csvContent = CSVExporter.exportForDrupal(articles)
        filename = CSVExporter.generateFilename('articles', articles[0].outline.site.name, 'drupal')
        break
      default:
        csvContent = await CSVExporter.exportArticles(articles, options)
        filename = CSVExporter.generateFilename('articles', articles[0].outline.site.name)
        break
    }

    // CSV as response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error exporting articles:', error)
    return NextResponse.json(
      { error: 'エクスポート中にエラーが発生しました' },
      { status: 500 }
    )
  }
}