'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, truncateText } from '@/lib/utils'
import Link from 'next/link'

export default function SitesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    url: '',
    siteImage: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data: sites, isLoading: sitesLoading } = useQuery(
    'sites',
    async () => {
      const response = await fetch('/api/sites')
      if (!response.ok) throw new Error('サイト一覧の取得に失敗しました')
      return response.json()
    }
  )

  const createSiteMutation = useMutation(
    async (siteData: typeof newSite) => {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'サイト作成に失敗しました')
      }
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sites')
        setNewSite({ name: '', url: '', siteImage: '' })
        setShowAddForm(false)
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    createSiteMutation.mutate(newSite)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              サイト管理
            </h1>
            <p className="text-gray-600 mt-2">
              記事生成を行うサイトを管理します
            </p>
          </div>
          
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'キャンセル' : '新しいサイトを追加'}
          </Button>
        </div>

        {/* 新規サイト追加フォーム */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>新しいサイトを追加</CardTitle>
              <CardDescription>
                サイト名とURL、またはサイトの説明を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サイト名 *
                  </label>
                  <Input
                    value={newSite.name}
                    onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                    placeholder="例: 料理レシピブログ"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サイトURL
                  </label>
                  <Input
                    type="url"
                    value={newSite.url}
                    onChange={(e) => setNewSite({...newSite, url: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サイトの説明
                  </label>
                  <Textarea
                    value={newSite.siteImage}
                    onChange={(e) => setNewSite({...newSite, siteImage: e.target.value})}
                    placeholder="サイトのコンテンツや特徴を説明してください"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={createSiteMutation.isLoading}
                  >
                    {createSiteMutation.isLoading ? '作成中...' : 'サイトを作成'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </Button>
                </div>

                {createSiteMutation.error && (
                  <div className="text-red-600 text-sm">
                    {(createSiteMutation.error as Error).message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* サイト一覧 */}
        {sitesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : sites && sites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site: any) => (
              <Card key={site.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{site.name}</CardTitle>
                  {site.url && (
                    <CardDescription>
                      <a 
                        href={site.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {site.url}
                      </a>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {site.siteImage && (
                    <p className="text-sm text-gray-600 mb-4">
                      {truncateText(site.siteImage, 100)}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex justify-between">
                      <span>URL数:</span>
                      <span>{site.siteUrls?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>記事概要:</span>
                      <span>{site.articleOutlines?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>記事数:</span>
                      <span>
                        {site.articleOutlines?.reduce((total: number, outline: any) => 
                          total + (outline.articles?.length || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>作成日:</span>
                      <span>{formatDate(site.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/sites/${site.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        管理
                      </Button>
                    </Link>
                    {!site.contentPolicy && (
                      <Link href={`/sites/${site.id}/policy`} className="flex-1">
                        <Button className="w-full">
                          方針作成
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🌐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                まだサイトがありません
              </h3>
              <p className="text-gray-600 mb-6">
                最初のサイトを追加して記事生成を始めましょう
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                最初のサイトを追加
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}