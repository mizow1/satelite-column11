import { prisma } from '@/lib/prisma'
import { AIServiceFactory } from '@/lib/ai/ai-factory'
import { EmailService, DailyProposalData } from '@/lib/email/email-service'
import { TokenManagerImpl } from '@/lib/ai/token-manager'

export class DailyProposalService {
  private emailService: EmailService
  private tokenManager: TokenManagerImpl

  constructor() {
    this.emailService = new EmailService()
    this.tokenManager = new TokenManagerImpl()
  }

  async generateAndSendDailyProposals(): Promise<void> {
    try {
      // メール通知が有効なユーザーを取得
      const users = await prisma.user.findMany({
        where: {
          settings: {
            emailNotifications: true
          }
        },
        include: {
          settings: true,
          sites: {
            where: {
              contentPolicy: {
                not: null
              }
            },
            take: 1, // 最初のサイトのみ
            orderBy: {
              updatedAt: 'desc'
            }
          }
        }
      })

      for (const user of users) {
        if (user.sites.length === 0) {
          continue // コンテンツポリシーが設定されているサイトがない場合はスキップ
        }

        const site = user.sites[0]
        
        try {
          // トークン制限チェック
          const canUse = await this.tokenManager.checkLimit(user.id)
          if (!canUse) {
            console.log(`ユーザー ${user.email} は月間トークン制限に達しているため、提案をスキップします`)
            continue
          }

          // 既存の記事概要を取得（重複回避）
          const existingOutlines = await prisma.articleOutline.findMany({
            where: { siteId: site.id },
            select: { title: true, outline: true, seoKeywords: true },
            orderBy: { createdAt: 'desc' },
            take: 50 // 最新50件をチェック
          })

          const aiOutlines = existingOutlines.map(outline => ({
            title: outline.title,
            outline: outline.outline,
            seoKeywords: outline.seoKeywords ? outline.seoKeywords.split(',') : []
          }))

          // AIサービスで記事概要を生成
          const aiService = AIServiceFactory.createService(user.settings?.aiService || 'gpt-4')
          const proposals = await aiService.generateArticleOutlines(
            site.contentPolicy!,
            3, // 毎日3つの提案
            aiOutlines
          )

          // メール送信データを準備
          const emailData: DailyProposalData = {
            userName: user.name || user.email,
            siteName: site.name,
            proposals: proposals.map(p => ({
              title: p.title,
              outline: p.outline,
              seoKeywords: p.seoKeywords
            })),
            siteUrl: process.env.NEXTAUTH_URL
          }

          // メール送信
          await this.emailService.sendDailyProposals(user.email, emailData)

          // トークン使用量を記録
          const tokensUsed = await aiService.getTokenUsage()
          if (tokensUsed > 0) {
            await this.tokenManager.recordUsage(
              user.id,
              user.settings?.aiService || 'gpt-4',
              tokensUsed
            )
          }

          console.log(`ユーザー ${user.email} に日次提案を送信しました`)

        } catch (error) {
          console.error(`ユーザー ${user.email} の日次提案生成中にエラー:`, error)
          // 個別のユーザーでエラーが発生しても続行
          continue
        }
      }

      console.log('日次提案の送信が完了しました')
    } catch (error) {
      console.error('日次提案処理中にエラーが発生しました:', error)
      throw error
    }
  }

  async generateProposalsForUser(userId: string, siteId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
        }
      })

      if (!user) {
        throw new Error('ユーザーが見つかりません')
      }

      const site = await prisma.site.findFirst({
        where: {
          id: siteId,
          userId
        }
      })

      if (!site || !site.contentPolicy) {
        throw new Error('サイトが見つからないか、コンテンツポリシーが設定されていません')
      }

      // トークン制限チェック
      const canUse = await this.tokenManager.checkLimit(userId)
      if (!canUse) {
        throw new Error('月間トークン制限に達しています')
      }

      // 既存の記事概要を取得
      const existingOutlines = await prisma.articleOutline.findMany({
        where: { siteId },
        select: { title: true, outline: true, seoKeywords: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      const aiOutlines = existingOutlines.map(outline => ({
        title: outline.title,
        outline: outline.outline,
        seoKeywords: outline.seoKeywords ? outline.seoKeywords.split(',') : []
      }))

      // AIサービスで記事概要を生成
      const aiService = AIServiceFactory.createService(user.settings?.aiService || 'gpt-4')
      const proposals = await aiService.generateArticleOutlines(
        site.contentPolicy,
        3,
        aiOutlines
      )

      // メール送信データを準備
      const emailData: DailyProposalData = {
        userName: user.name || user.email,
        siteName: site.name,
        proposals: proposals.map(p => ({
          title: p.title,
          outline: p.outline,
          seoKeywords: p.seoKeywords
        })),
        siteUrl: process.env.NEXTAUTH_URL
      }

      // メール送信
      await this.emailService.sendDailyProposals(user.email, emailData)

      // トークン使用量を記録
      const tokensUsed = await aiService.getTokenUsage()
      if (tokensUsed > 0) {
        await this.tokenManager.recordUsage(
          userId,
          user.settings?.aiService || 'gpt-4',
          tokensUsed
        )
      }

    } catch (error) {
      console.error('個別提案生成中にエラー:', error)
      throw error
    }
  }
}