import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            SEO記事生成システム
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI技術を活用してSEO最適化された高品質な記事を効率的に生成・管理。
            複数サイトの運営と多言語対応で、あなたのコンテンツマーケティングを加速します。
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                無料で始める
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🤖 AI記事生成</CardTitle>
              <CardDescription>
                GPT-4、Claude、Geminiから選択可能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                サイト情報を基にAIが記事作成方針を生成し、SEOキーワードを考慮した高品質な記事を20,000文字以上で作成します。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">🌍 多言語対応</CardTitle>
              <CardDescription>
                13言語での記事生成に対応
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                日本語、英語、中国語、韓国語など13言語に対応。グローバルなコンテンツマーケティングを効率的に実現できます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">📊 サイト管理</CardTitle>
              <CardDescription>
                複数サイトの一元管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                複数のサイトを管理し、それぞれに最適化された記事作成方針で効率的にコンテンツを生成できます。
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>📈 主な機能</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  サイトURL自動解析と記事方針生成
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  記事概要の一括生成（重複回避機能付き）
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  多言語記事の一括生成
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  CSV形式での記事エクスポート
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  毎日の記事提案メール配信
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  トークン使用量管理と制限機能
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 利用の流れ</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                  サイトURLやイメージを入力してサイトを登録
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                  AIが記事作成方針を自動生成
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                  記事概要を10個ずつ生成・評価
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">4</span>
                  選択した概要から記事本文を生成
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">5</span>
                  CSV形式でエクスポートして本番サイトに投稿
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            アカウント作成は無料です。数分で記事生成を開始できます。
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-12 py-4">
              無料アカウント作成
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}