export const SUPPORTED_LANGUAGES = {
  'ja': { name: '日本語', icon: '日' },
  'en': { name: '英語', icon: '英' },
  'zh-cn': { name: '中国語（簡体字）', icon: '簡' },
  'zh-tw': { name: '中国語（繁体字）', icon: '繁' },
  'ko': { name: '韓国語', icon: '韓' },
  'es': { name: 'スペイン語', icon: '西' },
  'ar': { name: 'アラビア語', icon: '阿' },
  'pt': { name: 'ポルトガル語', icon: '葡' },
  'fr': { name: 'フランス語', icon: '仏' },
  'de': { name: 'ドイツ語', icon: '独' },
  'ru': { name: 'ロシア語', icon: '露' },
  'it': { name: 'イタリア語', icon: '伊' },
  'hi': { name: 'ヒンディー語', icon: '印' },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

export function getLanguageIcon(code: string): string {
  return SUPPORTED_LANGUAGES[code as LanguageCode]?.icon || code
}

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code as LanguageCode]?.name || code
}

export function getSupportedLanguageCodes(): LanguageCode[] {
  return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]
}

export function getSupportedLanguages(): Array<{ code: LanguageCode; name: string; icon: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, icon }]) => ({
    code: code as LanguageCode,
    name,
    icon
  }))
}