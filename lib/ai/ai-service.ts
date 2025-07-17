export interface SiteInfo {
  name: string
  url?: string
  siteImage?: string
  urls?: string[]
}

export interface ArticleOutline {
  title: string
  outline: string
  seoKeywords: string[]
}

export interface AIService {
  generateContentPolicy(siteInfo: SiteInfo): Promise<string>
  generateArticleOutlines(policy: string, count: number, existingOutlines?: ArticleOutline[]): Promise<ArticleOutline[]>
  generateArticleContent(outline: ArticleOutline, language: string, userInstructions?: string): Promise<string>
  getTokenUsage(): Promise<number>
}

export interface TokenManager {
  recordUsage(userId: string, aiService: string, tokensUsed: number): Promise<void>
  getTotalUsage(userId: string): Promise<number>
  getMonthlyUsage(userId: string): Promise<number>
  checkLimit(userId: string): Promise<boolean>
}