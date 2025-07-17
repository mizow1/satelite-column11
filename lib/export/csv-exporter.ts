import { Article, ArticleOutline, Site } from '@prisma/client'

export interface ArticleWithDetails extends Article {
  outline: ArticleOutline & {
    site: Site
  }
}

export interface ExportOptions {
  includeMetadata?: boolean
  includeContent?: boolean
  includeRatings?: boolean
}

export class CSVExporter {
  static async exportArticles(
    articles: ArticleWithDetails[], 
    options: ExportOptions = {}
  ): Promise<string> {
    const {
      includeMetadata = true,
      includeContent = true,
      includeRatings = true
    } = options

    // CSVヘッダーを構築
    const headers = [
      'サイト名',
      '記事タイトル',
      '言語',
      '作成日'
    ]

    if (includeMetadata) {
      headers.push('SEOキーワード', '記事概要')
    }

    if (includeRatings) {
      headers.push('概要評価', '記事評価')
    }

    if (includeContent) {
      headers.push('記事本文')
    }

    headers.push('ユーザー指示')

    // CSVデータを構築
    const rows = articles.map(article => {
      const row = [
        this.escapeCSVField(article.outline.site.name),
        this.escapeCSVField(article.outline.title),
        this.escapeCSVField(article.language),
        article.createdAt.toISOString().split('T')[0]
      ]

      if (includeMetadata) {
        row.push(
          this.escapeCSVField(article.outline.seoKeywords || ''),
          this.escapeCSVField(article.outline.outline)
        )
      }

      if (includeRatings) {
        row.push(
          article.outline.userRating?.toString() || '',
          article.userRating?.toString() || ''
        )
      }

      if (includeContent) {
        row.push(this.escapeCSVField(article.content))
      }

      row.push(this.escapeCSVField(article.userInstructions || ''))

      return row
    })

    // CSVフォーマットに変換
    const csvLines = [headers.join(',')]
    rows.forEach(row => {
      csvLines.push(row.join(','))
    })

    return csvLines.join('\n')
  }

  static async exportOutlines(outlines: (ArticleOutline & { site: Site })[]): Promise<string> {
    const headers = [
      'サイト名',
      '記事タイトル',
      '記事概要',
      'SEOキーワード',
      'ユーザー評価',
      '作成日'
    ]

    const rows = outlines.map(outline => [
      this.escapeCSVField(outline.site.name),
      this.escapeCSVField(outline.title),
      this.escapeCSVField(outline.outline),
      this.escapeCSVField(outline.seoKeywords || ''),
      outline.userRating?.toString() || '',
      outline.createdAt.toISOString().split('T')[0]
    ])

    const csvLines = [headers.join(',')]
    rows.forEach(row => {
      csvLines.push(row.join(','))
    })

    return csvLines.join('\n')
  }

  static exportForWordPress(articles: ArticleWithDetails[]): string {
    const headers = [
      'post_title',
      'post_content',
      'post_excerpt',
      'post_status',
      'post_type',
      'post_category',
      'tags_input',
      'post_date'
    ]

    const rows = articles.map(article => [
      this.escapeCSVField(article.outline.title),
      this.escapeCSVField(article.content),
      this.escapeCSVField(article.outline.outline),
      'publish',
      'post',
      '',
      this.escapeCSVField(article.outline.seoKeywords || ''),
      article.createdAt.toISOString().replace('T', ' ').split('.')[0]
    ])

    const csvLines = [headers.join(',')]
    rows.forEach(row => {
      csvLines.push(row.join(','))
    })

    return csvLines.join('\n')
  }

  static exportForDrupal(articles: ArticleWithDetails[]): string {
    const headers = [
      'title',
      'body',
      'summary',
      'status',
      'type',
      'tags',
      'created'
    ]

    const rows = articles.map(article => [
      this.escapeCSVField(article.outline.title),
      this.escapeCSVField(article.content),
      this.escapeCSVField(article.outline.outline),
      '1',
      'article',
      this.escapeCSVField(article.outline.seoKeywords || ''),
      Math.floor(article.createdAt.getTime() / 1000).toString()
    ])

    const csvLines = [headers.join(',')]
    rows.forEach(row => {
      csvLines.push(row.join(','))
    })

    return csvLines.join('\n')
  }

  private static escapeCSVField(field: string): string {
    if (!field) return ''
    
    // フィールドにカンマ、改行、ダブルクォートが含まれている場合はダブルクォートで囲む
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      // ダブルクォートをエスケープ
      const escaped = field.replace(/"/g, '""')
      return `"${escaped}"`
    }
    
    return field
  }

  static generateFilename(
    type: 'articles' | 'outlines', 
    siteName?: string, 
    format: 'standard' | 'wordpress' | 'drupal' = 'standard'
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const typeStr = type === 'articles' ? '記事' : '記事概要'
    const siteStr = siteName ? `_${siteName}` : ''
    const formatStr = format !== 'standard' ? `_${format}` : ''
    
    return `${typeStr}${siteStr}${formatStr}_${timestamp}.csv`
  }
}