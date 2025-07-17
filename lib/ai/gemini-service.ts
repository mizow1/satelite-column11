import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIService, SiteInfo, ArticleOutline } from './ai-service'

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI
  private tokenUsage: number = 0

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
  }

  async generateContentPolicy(siteInfo: SiteInfo): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
以下のサイト情報を基に、SEO最適化記事の作成方針を作成してください。

サイト名: ${siteInfo.name}
${siteInfo.url ? `URL: ${siteInfo.url}` : ''}
${siteInfo.siteImage ? `サイト説明: ${siteInfo.siteImage}` : ''}
${siteInfo.urls?.length ? `関連URL: ${siteInfo.urls.join(', ')}` : ''}

以下の要素を含む詳細な記事作成方針を作成してください：
1. ターゲットユーザー
2. 主要SEOキーワード戦略
3. コンテンツの方向性
4. 記事のトーン・スタイル
5. 重視すべきSEO要素
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Geminiはトークン使用量の詳細を提供しないため、概算
    this.tokenUsage += Math.ceil(text.length / 4)
    
    return text
  }

  async generateArticleOutlines(
    policy: string, 
    count: number, 
    existingOutlines?: ArticleOutline[]
  ): Promise<ArticleOutline[]> {
    const model = this.client.getGenerativeModel({ model: 'gemini-pro' })
    const existingTitles = existingOutlines?.map(o => o.title).join('\n') || ''
    
    const prompt = `
以下の記事作成方針に基づいて、${count}個の記事概要を作成してください：

${policy}

${existingTitles ? `
既存の記事タイトル（重複を避けてください）：
${existingTitles}
` : ''}

各記事概要は以下の形式で出力してください：
---
タイトル: [記事タイトル]
概要: [記事の概要（200-300文字）]
SEOキーワード: [キーワード1, キーワード2, キーワード3]
---

${count}個の記事概要を作成してください。
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    this.tokenUsage += Math.ceil(text.length / 4)
    
    return this.parseOutlines(text)
  }

  async generateArticleContent(
    outline: ArticleOutline, 
    language: string, 
    userInstructions?: string
  ): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-pro' })
    
    const languageMap: { [key: string]: string } = {
      'ja': '日本語',
      'en': '英語',
      'zh-cn': '中国語（簡体字）',
      'zh-tw': '中国語（繁体字）',
      'ko': '韓国語',
      'es': 'スペイン語',
      'ar': 'アラビア語',
      'pt': 'ポルトガル語',
      'fr': 'フランス語',
      'de': 'ドイツ語',
      'ru': 'ロシア語',
      'it': 'イタリア語',
      'hi': 'ヒンディー語'
    }

    const targetLanguage = languageMap[language] || '日本語'

    const prompt = `
以下の記事概要とSEOキーワードに基づいて、${targetLanguage}で20,000文字以上の詳細な記事を作成してください：

タイトル: ${outline.title}
概要: ${outline.outline}
SEOキーワード: ${outline.seoKeywords.join(', ')}

${userInstructions ? `
ユーザーからの追加指示:
${userInstructions}
` : ''}

要件：
- マークダウン形式で出力
- 見出し構造を適切に使用（H1, H2, H3など）
- SEOキーワードを自然に配置
- 読みやすく、価値のあるコンテンツ
- 20,000文字以上の詳細な内容
- AIからのメッセージや文字数カウントなどは含めない
- 記事本文のみを出力

記事本文のみを出力してください：
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    this.tokenUsage += Math.ceil(text.length / 4)
    
    return text
  }

  async getTokenUsage(): Promise<number> {
    return this.tokenUsage
  }

  private parseOutlines(content: string): ArticleOutline[] {
    const outlines: ArticleOutline[] = []
    const sections = content.split('---').filter(section => section.trim())

    for (const section of sections) {
      const lines = section.trim().split('\n')
      let title = ''
      let outline = ''
      let seoKeywords: string[] = []

      for (const line of lines) {
        if (line.startsWith('タイトル:')) {
          title = line.replace('タイトル:', '').trim()
        } else if (line.startsWith('概要:')) {
          outline = line.replace('概要:', '').trim()
        } else if (line.startsWith('SEOキーワード:')) {
          const keywordsStr = line.replace('SEOキーワード:', '').trim()
          seoKeywords = keywordsStr.split(',').map(k => k.trim())
        }
      }

      if (title && outline && seoKeywords.length > 0) {
        outlines.push({ title, outline, seoKeywords })
      }
    }

    return outlines
  }
}