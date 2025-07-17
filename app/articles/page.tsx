'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, getLanguageIcon, getLanguageName, truncateText } from '@/lib/utils'
import { SUPPORTED_LANGUAGES } from '@/lib/constants/languages'
import Link from 'next/link'

export default function ArticlesPage(): React.ReactElement {
  const searchParams = useSearchParams()
  const siteId = searchParams.get('siteId')
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const { data: articles, isLoading } = useQuery<any[]>(
    ['articles', siteId],
    async () => {
      const url = siteId ? `/api/articles?siteId=${siteId}` : '/api/articles'
      const response = await fetch(url)
      if (!response.ok) throw new Error('記事一覧の取得に失敗しました')
      return response.json()
    }
  )

  const { data: sites } = useQuery<any[]>(
    'sites',
    async () => {
      const response = await fetch('/api/sites')
      if (!response.ok) throw new Error('サイト一覧の取得に失敗しました')
      return response.json()
    }
  )

  const exportMutation = useMutation(
    async (exportData: any) => {
      setIsExporting(true)
      const response = await fetch('/api/articles/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'エクスポートに失敗しました')
      }

      // CSVファイルとしてダウンロード
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : 'articles.csv'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    {
      onSettled: () => {
        setIsExporting(false)
      }
    }
  )

  // フィルタリング
  const filteredArticles: any[] = articles?.filter((article: any) => {
    const matchesSearch = searchTerm === '' || 
      article.outline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.outline.site.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLanguage = selectedLanguage === '' || article.language === selectedLanguage
    
    return matchesSearch && matchesLanguage
  }) || []

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(filteredArticles.map((article: any) => article.id))
    }
  }

  const handleSelectArticle = (articleId: string) => {
    if (selectedArticles.includes(articleId)) {
      setSelectedArticles(selectedArticles.filter(id => id !== articleId))
    } else {
      setSelectedArticles([...selectedArticles, articleId])
    }
  }

  const handleExport = () => {
    if (selectedArticles.length === 0) {
      alert('エクスポートする記事を選択してください')
      return
    }

    exportMutation.mutate({
      articleIds: selectedArticles,
      format: 'standard',
      options: {
        includeMetadata: true,
        includeContent: true,
        includeRatings: true
      }
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              記事管理
            </h1>
            <p className="text-gray-600 mt-2">
              生成された記事の管理と一括操作
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>フィルター・検索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  検索
                </label>
                <Input
                  placeholder="記事タイトルまたはサイト名で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  言語
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="">すべての言語</option>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name }]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  一括操作
                </label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSelectAll}
                    className="flex-1"
                  >
                    {selectedArticles.length === filteredArticles.length ? '選択解除' : 'すべて選択'}
                  </Button>
                  <Button 
                    onClick={handleExport}
                    disabled={selectedArticles.length === 0 || isExporting}
                    className="flex-1"
                  >
                    {isExporting ? 'エクスポート中...' : 'CSV出力'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(filteredArticles && filteredArticles.length > 0) ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {filteredArticles.length}件の記事が見つかりました
                {selectedArticles.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    （{selectedArticles.length}件選択中）
                  </span>
                )}
              </p>
            </div>

            {filteredArticles.map((article: any) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {article.outline.title}
                          </h3>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              🌐 {article.outline.site.name}
                            </span>
                            <span className="flex items-center">
                              {getLanguageIcon(article.language)} {getLanguageName(article.language)}
                            </span>
                            <span>
                              📅 {formatDate(article.createdAt)}
                            </span>
                            {article.userRating && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                評価: {article.userRating}点
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {truncateText(article.outline.outline, 150)}
                          </p>
                          
                          {article.outline.seoKeywords && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {article.outline.seoKeywords.split(',').slice(0, 5).map((keyword: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            文字数: {article.content.length.toLocaleString()}文字
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Link href={`/articles/${article.id}`}>
                            <Button variant="outline" size="sm">
                              表示
                            </Button>
                          </Link>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Button variant="outline" size="sm">
                              編集
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                条件に一致する記事が見つかりませんでした
              </h3>
              <p className="text-gray-600">
                検索条件を変更してみてください
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                まだ記事がありません
              </h3>
              <p className="text-gray-600 mb-6">
                サイトを登録して記事を生成しましょう
              </p>
              <div className="space-x-4">
                <Link href="/sites">
                  <Button>
                    サイト管理
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">
                    ダッシュボードに戻る
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {exportMutation.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {(exportMutation.error as Error).message}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}