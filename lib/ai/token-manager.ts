import { prisma } from '@/lib/prisma'
import { TokenManager } from './ai-service'

export class TokenManagerImpl implements TokenManager {
  async recordUsage(userId: string, aiService: string, tokensUsed: number): Promise<void> {
    await prisma.tokenUsage.create({
      data: {
        userId,
        aiService,
        tokensUsed,
        usageDate: new Date(),
      }
    })
  }

  async getTotalUsage(userId: string): Promise<number> {
    const result = await prisma.tokenUsage.aggregate({
      where: { userId },
      _sum: { tokensUsed: true }
    })
    
    return result._sum.tokensUsed || 0
  }

  async getMonthlyUsage(userId: string): Promise<number> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const result = await prisma.tokenUsage.aggregate({
      where: {
        userId,
        usageDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { tokensUsed: true }
    })
    
    return result._sum.tokensUsed || 0
  }

  async checkLimit(userId: string): Promise<boolean> {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    if (!userSettings) {
      return false
    }

    const monthlyUsage = await this.getMonthlyUsage(userId)
    return monthlyUsage < userSettings.tokenLimitMonthly
  }

  async getUsageByService(userId: string): Promise<Record<string, number>> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const usages = await prisma.tokenUsage.groupBy({
      by: ['aiService'],
      where: {
        userId,
        usageDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { tokensUsed: true }
    })

    const result: Record<string, number> = {}
    usages.forEach(usage => {
      result[usage.aiService] = usage._sum.tokensUsed || 0
    })

    return result
  }

  async getDailyUsage(userId: string, days: number = 30): Promise<Array<{ date: Date; tokensUsed: number }>> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const usages = await prisma.tokenUsage.groupBy({
      by: ['usageDate'],
      where: {
        userId,
        usageDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { tokensUsed: true },
      orderBy: { usageDate: 'asc' }
    })

    return usages.map(usage => ({
      date: usage.usageDate,
      tokensUsed: usage._sum.tokensUsed || 0
    }))
  }
}