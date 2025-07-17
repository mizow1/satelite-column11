import axios from 'axios'
import * as cheerio from 'cheerio'

export interface CrawlResult {
  urls: string[]
  error?: string
}

export class SiteCrawler {
  private visited = new Set<string>()
  private maxDepth = 2
  private maxUrls = 50

  async crawlSite(baseUrl: string): Promise<CrawlResult> {
    try {
      const normalizedBaseUrl = this.normalizeUrl(baseUrl)
      const urls = await this.crawlRecursive(normalizedBaseUrl, normalizedBaseUrl, 0)
      
      return {
        urls: Array.from(urls).slice(0, this.maxUrls)
      }
    } catch (error) {
      console.error('Crawling error:', error)
      return {
        urls: [],
        error: 'サイトのクロール中にエラーが発生しました'
      }
    }
  }

  private async crawlRecursive(
    currentUrl: string, 
    baseUrl: string, 
    depth: number
  ): Promise<Set<string>> {
    const foundUrls = new Set<string>()
    
    if (depth > this.maxDepth || this.visited.has(currentUrl) || foundUrls.size >= this.maxUrls) {
      return foundUrls
    }

    this.visited.add(currentUrl)
    foundUrls.add(currentUrl)

    try {
      const response = await axios.get(currentUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (response.status !== 200) {
        return foundUrls
      }

      const $ = cheerio.load(response.data)
      const links: string[] = []

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')
        if (href) {
          const absoluteUrl = this.resolveUrl(href, currentUrl)
          if (this.isValidUrl(absoluteUrl, baseUrl)) {
            links.push(absoluteUrl)
          }
        }
      })

      // 並列処理で子URLをクロール
      const promises = links.slice(0, 10).map(async (link) => {
        if (!this.visited.has(link) && foundUrls.size < this.maxUrls) {
          const childUrls = await this.crawlRecursive(link, baseUrl, depth + 1)
          childUrls.forEach(url => foundUrls.add(url))
        }
      })

      await Promise.all(promises)
    } catch (error) {
      console.error(`Error crawling ${currentUrl}:`, error)
    }

    return foundUrls
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).href
    } catch {
      return ''
    }
  }

  private isValidUrl(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url)
      const baseUrlObj = new URL(baseUrl)
      
      // 同じドメインかチェック
      if (urlObj.hostname !== baseUrlObj.hostname) {
        return false
      }

      // 特定のファイル拡張子を除外
      const excludeExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.jpg', '.jpeg', '.png', '.gif']
      const pathname = urlObj.pathname.toLowerCase()
      
      if (excludeExtensions.some(ext => pathname.endsWith(ext))) {
        return false
      }

      // フラグメント（#）は除外
      if (urlObj.hash) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  async getPageTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      return $('title').text().trim() || url
    } catch {
      return url
    }
  }

  async getPageDescription(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      
      // メタディスクリプションを取得
      const metaDescription = $('meta[name="description"]').attr('content')
      if (metaDescription) {
        return metaDescription.trim()
      }

      // OGディスクリプションを取得
      const ogDescription = $('meta[property="og:description"]').attr('content')
      if (ogDescription) {
        return ogDescription.trim()
      }

      // 最初のpタグの内容を取得
      const firstParagraph = $('p').first().text().trim()
      if (firstParagraph) {
        return firstParagraph.substring(0, 200) + (firstParagraph.length > 200 ? '...' : '')
      }

      return ''
    } catch {
      return ''
    }
  }
}