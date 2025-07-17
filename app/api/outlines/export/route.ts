import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CSVExporter } from '@/lib/export/csv-exporter'
import { z } from 'zod'

const exportOutlinesSchema = z.object({
  outlineIds: z.array(z.string()).optional(),
  siteId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { outlineIds, siteId } = exportOutlinesSchema.parse(body)

    let whereClause: any = {
      site: {
        userId: session.user.id
      }
    }

    if (outlineIds && outlineIds.length > 0) {
      whereClause.id = { in: outlineIds }
    } else if (siteId) {
      whereClause.siteId = siteId
    }

    const outlines = await prisma.articleOutline.findMany({
      where: whereClause,
      include: {
        site: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (outlines.length === 0) {
      return NextResponse.json(
        { error: 'エクスポートする記事概要が見つかりません' },
        { status: 404 }
      )
    }

    const csvContent = await CSVExporter.exportOutlines(outlines)
    const filename = CSVExporter.generateFilename('outlines', outlines[0].site.name)

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

    console.error('Error exporting outlines:', error)
    return NextResponse.json(
      { error: 'エクスポート中にエラーが発生しました' },
      { status: 500 }
    )
  }
}