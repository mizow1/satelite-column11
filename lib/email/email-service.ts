import nodemailer from 'nodemailer'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface DailyProposalData {
  userName: string
  siteName: string
  proposals: Array<{
    title: string
    outline: string
    seoKeywords: string[]
  }>
  siteUrl?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_PORT === '465',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      })
    } catch (error) {
      console.error('メール送信エラー:', error)
      throw new Error('メール送信に失敗しました')
    }
  }

  async sendDailyProposals(
    to: string,
    data: DailyProposalData
  ): Promise<void> {
    const template = this.generateDailyProposalTemplate(data)
    await this.sendEmail(to, template.subject, template.html, template.text)
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const template = this.generateWelcomeTemplate(userName)
    await this.sendEmail(to, template.subject, template.html, template.text)
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetLink: string
  ): Promise<void> {
    const template = this.generatePasswordResetTemplate(userName, resetLink)
    await this.sendEmail(to, template.subject, template.html, template.text)
  }

  async sendTokenLimitWarning(
    to: string,
    userName: string,
    currentUsage: number,
    limit: number
  ): Promise<void> {
    const template = this.generateTokenLimitWarningTemplate(
      userName,
      currentUsage,
      limit
    )
    await this.sendEmail(to, template.subject, template.html, template.text)
  }

  private generateDailyProposalTemplate(data: DailyProposalData): EmailTemplate {
    const today = new Date().toLocaleDateString('ja-JP')
    
    const proposalsHtml = data.proposals
      .map(
        (proposal, index) => `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h3 style="color: #2563eb; margin-bottom: 10px;">提案 ${index + 1}: ${proposal.title}</h3>
          <p style="margin-bottom: 15px; line-height: 1.6;">${proposal.outline}</p>
          <div style="background-color: #f8fafc; padding: 10px; border-radius: 4px;">
            <strong>SEOキーワード:</strong> ${proposal.seoKeywords.join(', ')}
          </div>
        </div>
      `
      )
      .join('')

    const proposalsText = data.proposals
      .map(
        (proposal, index) => `
提案 ${index + 1}: ${proposal.title}
${proposal.outline}
SEOキーワード: ${proposal.seoKeywords.join(', ')}
---
      `
      )
      .join('\n')

    const subject = `【${data.siteName}】本日の記事提案 - ${today}`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>本日の記事提案</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">本日の記事提案</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${today}</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
      <p>こんにちは、${data.userName}さん</p>
      <p><strong>${data.siteName}</strong> の本日の記事提案をお送りします。</p>
      
      ${proposalsHtml}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #dbeafe; border-radius: 8px;">
        <p style="margin: 0;">
          これらの提案をご確認いただき、気に入ったものがございましたら、
          管理画面にログインして記事生成を開始してください。
        </p>
        ${data.siteUrl ? `<p style="margin: 10px 0 0 0;"><a href="${data.siteUrl}" style="color: #2563eb;">管理画面を開く</a></p>` : ''}
      </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
      <p>このメールは自動送信されています。</p>
      <p>通知設定の変更は管理画面から行えます。</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
本日の記事提案 - ${today}

こんにちは、${data.userName}さん

${data.siteName} の本日の記事提案をお送りします。

${proposalsText}

これらの提案をご確認いただき、気に入ったものがございましたら、
管理画面にログインして記事生成を開始してください。

このメールは自動送信されています。
通知設定の変更は管理画面から行えます。
    `

    return { subject, html, text }
  }

  private generateWelcomeTemplate(userName: string): EmailTemplate {
    const subject = 'SEO記事生成サービスへようこそ！'

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ようこそ</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">ようこそ！</h1>
    </div>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
      <p>${userName}さん、アカウント作成ありがとうございます！</p>
      
      <p>SEO記事生成サービスにご登録いただき、ありがとうございます。
      このサービスでは、AI技術を活用してSEO最適化された高品質な記事を
      効率的に生成・管理することができます。</p>
      
      <h2>主な機能:</h2>
      <ul>
        <li>サイト情報に基づく記事作成方針の自動生成</li>
        <li>SEOキーワードを考慮した記事概要の提案</li>
        <li>多言語対応の記事本文生成</li>
        <li>CSV形式での記事エクスポート</li>
        <li>毎日の記事提案メール配信</li>
      </ul>
      
      <p>ぜひ管理画面にログインして、最初のサイトを登録してください。</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
ようこそ！

${userName}さん、アカウント作成ありがとうございます！

SEO記事生成サービスにご登録いただき、ありがとうございます。
このサービスでは、AI技術を活用してSEO最適化された高品質な記事を
効率的に生成・管理することができます。

主な機能:
- サイト情報に基づく記事作成方針の自動生成
- SEOキーワードを考慮した記事概要の提案
- 多言語対応の記事本文生成
- CSV形式での記事エクスポート
- 毎日の記事提案メール配信

ぜひ管理画面にログインして、最初のサイトを登録してください。
    `

    return { subject, html, text }
  }

  private generatePasswordResetTemplate(
    userName: string,
    resetLink: string
  ): EmailTemplate {
    const subject = 'パスワードリセットのご案内'

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>パスワードリセット</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">パスワードリセット</h1>
    </div>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
      <p>${userName}さん</p>
      
      <p>パスワードリセットのご依頼を受け付けました。</p>
      
      <p>下記のリンクをクリックして、新しいパスワードを設定してください。</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          パスワードをリセット
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        このリンクは24時間で期限切れになります。<br>
        もしこのメールに心当たりがない場合は、無視してください。
      </p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
パスワードリセット

${userName}さん

パスワードリセットのご依頼を受け付けました。

下記のリンクをクリックして、新しいパスワードを設定してください。

${resetLink}

このリンクは24時間で期限切れになります。
もしこのメールに心当たりがない場合は、無視してください。
    `

    return { subject, html, text }
  }

  private generateTokenLimitWarningTemplate(
    userName: string,
    currentUsage: number,
    limit: number
  ): EmailTemplate {
    const percentage = Math.round((currentUsage / limit) * 100)
    const subject = `【警告】月間トークン使用量が${percentage}%に達しました`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>トークン使用量警告</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">⚠️ トークン使用量警告</h1>
    </div>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
      <p>${userName}さん</p>
      
      <p>今月のトークン使用量が制限の${percentage}%に達しました。</p>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>現在の使用量:</strong> ${currentUsage.toLocaleString()} トークン</p>
        <p style="margin: 5px 0 0 0;"><strong>月間制限:</strong> ${limit.toLocaleString()} トークン</p>
      </div>
      
      <p>制限に達すると、記事生成機能が一時的に停止されます。
      ご利用予定がある場合は、使用量を管理画面でご確認ください。</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
⚠️ トークン使用量警告

${userName}さん

今月のトークン使用量が制限の${percentage}%に達しました。

現在の使用量: ${currentUsage.toLocaleString()} トークン
月間制限: ${limit.toLocaleString()} トークン

制限に達すると、記事生成機能が一時的に停止されます。
ご利用予定がある場合は、使用量を管理画面でご確認ください。
    `

    return { subject, html, text }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }
}