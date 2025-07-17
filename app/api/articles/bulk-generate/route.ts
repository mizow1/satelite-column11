import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIServiceFactory } from '@/lib/ai/ai-factory'
import { TokenManagerImpl } from '@/lib/ai/token-manager'
import { z } from 'zod'

const bulkGenerateSchema = z.object({
  outlineIds: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  userInstructions: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { outlineIds, languages, userInstructions } = bulkGenerateSchema.parse(body)

    // 概要の存在チェック
    const outlines = await prisma.articleOutline.findMany({
      where: {
        id: { in: outlineIds },
        site: {
          userId: session.user.id
        }
      }
    })

    if (outlines.length !== outlineIds.length) {
      return NextResponse.json(
        { error: '指定された記事概要の一部が見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーの設定を取得
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!userSettings) {
      return NextResponse.json(
        { error: 'ユーザー設定が見つかりません' },
        { status: 400 }
      )
    }

    // トークン制限チェック
    const tokenManager = new TokenManagerImpl()
    const canUse = await tokenManager.checkLimit(session.user.id)
    
    if (!canUse) {
      return NextResponse.json(
        { error: '月間トークン制限に達しています' },
        { status: 429 }
      )
    }

    // AIサービスを取得
    const aiService = AIServiceFactory.createService(userSettings.aiService)

    const results = []
    let totalTokensUsed = 0

    // 各概要と言語の組み合わせで記事を生成
    for (const outline of outlines) {
      for (const language of languages) {
        try {
          // 既に存在する記事はスキップ
          const existingArticle = await prisma.article.findFirst({
            where: {
              outlineId: outline.id,
              language
            }
          })

          if (existingArticle) {
            results.push({
              outlineId: outline.id,
              language,
              status: 'skipped',
              reason: '既に存在します'
            })
            continue
          }

          // 記事概要情報を準備
          const articleOutline = {
            title: outline.title,
            outline: outline.outline,
            seoKeywords: outline.seoKeywords ? outline.seoKeywords.split(',') : []
          }

          // 記事を生成
          const content = await aiService.generateArticleContent(
            articleOutline,
            language,
            userInstructions
          )

          // データベースに保存
          const article = await prisma.article.create({
            data: {
              outlineId: outline.id,
              language,
              content,
              userInstructions
            }
          })

          // トークン使用量を累積
          const tokensUsed = await aiService.getTokenUsage()
          totalTokensUsed += tokensUsed

          results.push({
            outlineId: outline.id,
            language,
            status: 'success',
            articleId: article.id
          })

          // プログレス情報を返すためのSSEを実装する場合はここに追加

        } catch (error) {
          console.error(`Error generating article for outline ${outline.id}, language ${language}:`, error)
          results.push({
            outlineId: outline.id,
            language,
            status: 'error',
            error: '記事生成中にエラーが発生しました'
          })
        }
      }
    }

    // トークン使用量を記録
    if (totalTokensUsed > 0) {
      await tokenManager.recordUsage(session.user.id, userSettings.aiService, totalTokensUsed)
    }

    const successCount = results.filter(r => r.status === 'success').length
    const skipCount = results.filter(r => r.status === 'skipped').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        skipped: skipCount,
        errors: errorCount
      },
      totalTokensUsed
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error in bulk generation:', error)
    return NextResponse.json(
      { error: '一括生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}