'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, getLanguageIcon } from '@/lib/utils'
import { SUPPORTED_LANGUAGES } from '@/lib/constants/languages'
import Link from 'next/link'

export default function SiteDetailPage() {
  const params = useParams()
  const siteId = params.id as string
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [isGeneratingOutlines, setIsGeneratingOutlines] = useState(false)
  const queryClient = useQueryClient()

  const { data: site, isLoading } = useQuery(
    ['site', siteId],
    async () => {
      const response = await fetch(`/api/sites/${siteId}`)
      if (!response.ok) throw new Error('サイト情報の取得に失敗しました')
      return response.json()
    }
  )

  const { data: outlines } = useQuery(
    ['outlines', siteId],
    async () => {
      const response = await fetch(`/api/sites/${siteId}/outlines`)
      if (!response.ok) throw new Error('記事概要の取得に失敗しました')
      return response.json()
    }
  )

  const crawlMutation = useMutation(
    async () => {
      setIsCrawling(true)
      const response = await fetch(`/api/sites/${siteId}/crawl`, {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'URL取得に失敗しました')
      }
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['site', siteId])
      },
      onSettled: () => {
        setIsCrawling(false)
      }
    }
  )

  const generatePolicyMutation = useMutation(
    async () => {
      setIsGeneratingPolicy(true)
      const response = await fetch(`/api/sites/${siteId}/policy`, {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '記事作成方針の生成に失敗しました')
      }
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['site', siteId])
      },
      onSettled: () => {
        setIsGeneratingPolicy(false)
      }
    }
  )

  const generateOutlinesMutation = useMutation(
    async () => {
      setIsGeneratingOutlines(true)
      const response = await fetch(`/api/sites/${siteId}/outlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '記事概要の生成に失敗しました')
      }
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['outlines', siteId])
      },
      onSettled: () => {
        setIsGeneratingOutlines(false)
      }
    }
  )

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

  if (!site) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            サイトが見つかりません
          </h1>
          <Link href="/sites">
            <Button>サイト一覧に戻る</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {site.name}
            </h1>
            {site.url && (
              <a 
                href={site.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 block"
              >
                {site.url}
              </a>
            )}
            <p className="text-gray-600 mt-2">
              作成日: {formatDate(site.createdAt)}
            </p>
          </div>

          <Link href="/sites">
            <Button variant="outline">
              ← サイト一覧に戻る
            </Button>
          </Link>
        </div>

        {/* サイト情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* URL管理 */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>URL管理</CardTitle>
                    <CardDescription>
                      サイトの関連URLを管理します
                    </CardDescription>
                  </div>
                  {site.url && (
                    <Button 
                      onClick={() => crawlMutation.mutate()}
                      disabled={isCrawling}
                    >
                      {isCrawling ? 'URL取得中...' : 'URL自動取得'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {site.siteUrls && site.siteUrls.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {site.siteUrls.map((siteUrl: any) => (
                      <div key={siteUrl.id} className="flex items-center justify-between p-2 border rounded">
                        <a 
                          href={siteUrl.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate flex-1"
                        >
                          {siteUrl.url}
                        </a>
                        <span className={`px-2 py-1 text-xs rounded ${
                          siteUrl.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {siteUrl.isActive ? '有効' : '無効'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {site.url ? 'URL自動取得ボタンを押してURLを取得してください' : 'URLが設定されていません'}
                  </div>
                )}
                {crawlMutation.error && (
                  <div className="text-red-600 text-sm mt-2">
                    {(crawlMutation.error as Error).message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 記事作成方針 */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>記事作成方針</CardTitle>
                    <CardDescription>
                      AIが生成する記事の方針を管理します
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => generatePolicyMutation.mutate()}
                    disabled={isGeneratingPolicy || !site.url}
                  >
                    {isGeneratingPolicy ? '生成中...' : '方針を生成'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {site.contentPolicy ? (
                  <Textarea
                    value={site.contentPolicy}
                    readOnly
                    rows={8}
                    className="text-sm"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {site.url ? '記事作成方針を生成してください' : 'サイトURLを設定してから方針を生成してください'}
                  </div>
                )}
                {generatePolicyMutation.error && (
                  <div className="text-red-600 text-sm mt-2">
                    {(generatePolicyMutation.error as Error).message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 統計情報 */}
            <Card>
              <CardHeader>
                <CardTitle>統計情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL数:</span>
                  <span className="font-medium">{site.siteUrls?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">記事概要:</span>
                  <span className="font-medium">{site.articleOutlines?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">記事数:</span>
                  <span className="font-medium">
                    {site.articleOutlines?.reduce((total: number, outline: any) => 
                      total + (outline.articles?.length || 0), 0) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => generateOutlinesMutation.mutate()}
                  disabled={!site.contentPolicy || isGeneratingOutlines}
                >
                  {isGeneratingOutlines ? '概要生成中...' : '記事概要を生成'}
                </Button>
                
                <Link href={`/sites/${siteId}/articles`} className="block">
                  <Button variant="outline" className="w-full">
                    記事を管理
                  </Button>
                </Link>
                
                <Link href={`/articles?siteId=${siteId}`} className="block">
                  <Button variant="outline" className="w-full">
                    記事一覧を表示
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 記事概要一覧 */}
        {outlines && outlines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>記事概要一覧</CardTitle>
              <CardDescription>
                生成された記事概要の一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outlines.slice(0, 5).map((outline: any) => (
                  <div key={outline.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{outline.title}</h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(outline.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {outline.outline}
                    </p>
                    {outline.seoKeywords && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {outline.seoKeywords.split(',').map((keyword: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {keyword.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 多言語対応状況 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500 mr-2">対応言語:</span>
                        {Object.keys(SUPPORTED_LANGUAGES).map((code) => {
                          const hasArticle = outline.articles?.some((article: any) => article.language === code)
                          return (
                            <span 
                              key={code}
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                hasArticle ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {getLanguageIcon(code)}
                            </span>
                          )
                        })}
                      </div>
                      
                      <div className="flex space-x-2">
                        {outline.userRating && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            評価: {outline.userRating}点
                          </span>
                        )}
                        <Link href={`/outlines/${outline.id}`}>
                          <Button variant="outline" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {outlines.length > 5 && (
                  <div className="text-center">
                    <Link href={`/sites/${siteId}/outlines`}>
                      <Button variant="ghost">
                        すべての記事概要を見る ({outlines.length - 5}件)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {generateOutlinesMutation.error && (
                <div className="text-red-600 text-sm mt-4">
                  {(generateOutlinesMutation.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}