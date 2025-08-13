/**
 * 数値フォーマッターユーティリティ
 * 日本語ロケールでの通貨・数値・パーセンテージの表示を統一
 */
export class NumberFormatter {
  private static readonly locale = 'ja-JP'
  
  /**
   * 通貨フォーマット（円）
   * @param value 金額
   * @param options フォーマットオプション
   * @returns フォーマットされた通貨文字列
   */
  static currency(value: number, options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    compact?: boolean
  }): string {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 0,
      compact = false
    } = options || {}

    // 非常に大きな数値の場合は万、億単位で表示
    if (compact && Math.abs(value) >= 100000000) {
      const okuValue = value / 100000000
      return `${okuValue.toFixed(1)}億円`
    } else if (compact && Math.abs(value) >= 10000) {
      const manValue = value / 10000
      return `${manValue.toFixed(0)}万円`
    }

    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(Math.round(value))
  }

  /**
   * パーセンテージフォーマット
   * @param value 小数点値（0.05 = 5%）
   * @param decimals 小数点以下桁数
   * @returns フォーマットされたパーセンテージ文字列
   */
  static percentage(value: number, decimals = 1): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  /**
   * 数値フォーマット（3桁区切り）
   * @param value 数値
   * @param decimals 小数点以下桁数
   * @returns フォーマットされた数値文字列
   */
  static number(value: number, decimals = 0): string {
    return new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  /**
   * 大きな数値の簡略表示
   * @param value 数値
   * @returns 簡略化された文字列（例：1.2万、3.4億）
   */
  static compact(value: number): string {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    if (absValue >= 100000000) {  // 1億以上
      return `${sign}${(absValue / 100000000).toFixed(1)}億`
    } else if (absValue >= 10000) {  // 1万以上
      return `${sign}${(absValue / 10000).toFixed(1)}万`
    } else if (absValue >= 1000) {  // 1千以上
      return `${sign}${(absValue / 1000).toFixed(1)}千`
    } else {
      return `${sign}${absValue.toFixed(0)}`
    }
  }

  /**
   * 年数の表示フォーマット
   * @param years 年数
   * @returns 年数文字列
   */
  static years(years: number): string {
    return `${years}年目`
  }

  /**
   * 月数の表示フォーマット
   * @param months 月数
   * @returns 月数文字列
   */
  static months(months: number): string {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    if (years > 0 && remainingMonths > 0) {
      return `${years}年${remainingMonths}ヶ月`
    } else if (years > 0) {
      return `${years}年`
    } else {
      return `${months}ヶ月`
    }
  }

  /**
   * チャート用のツールチップフォーマット
   * @param value 数値
   * @param type フォーマットタイプ
   * @returns フォーマットされた文字列
   */
  static tooltip(value: number, type: 'currency' | 'percentage' | 'number'): string {
    switch (type) {
      case 'currency':
        return this.currency(value, { compact: true })
      case 'percentage':
        return this.percentage(value, 2)
      case 'number':
        return this.number(value, 0)
      default:
        return value.toString()
    }
  }

  /**
   * 差分の表示（増減表示）
   * @param current 現在値
   * @param previous 前回値
   * @param type フォーマットタイプ
   * @returns 差分文字列（+/-付き）
   */
  static difference(
    current: number, 
    previous: number, 
    type: 'currency' | 'percentage' | 'number'
  ): string {
    const diff = current - previous
    const sign = diff >= 0 ? '+' : ''
    
    switch (type) {
      case 'currency':
        return `${sign}${this.currency(diff)}`
      case 'percentage':
        const percentDiff = previous !== 0 ? diff / previous : 0
        return `${sign}${this.percentage(percentDiff)}`
      case 'number':
        return `${sign}${this.number(diff)}`
      default:
        return `${sign}${diff}`
    }
  }

  /**
   * 期間の表示
   * @param startYear 開始年
   * @param endYear 終了年
   * @returns 期間文字列
   */
  static period(startYear: number, endYear: number): string {
    if (startYear === endYear) {
      return `${startYear}年目`
    }
    return `${startYear}年目〜${endYear}年目`
  }

  /**
   * 投資成果のサマリー表示
   * @param totalValue 最終資産額
   * @param totalContributed 元本総額
   * @param years 投資期間
   * @returns サマリー文字列
   */
  static investmentSummary(
    totalValue: number, 
    totalContributed: number, 
    years: number
  ): string {
    const profit = totalValue - totalContributed
    const profitRate = totalContributed > 0 ? profit / totalContributed : 0
    
    return [
      `${years}年間の積立投資`,
      `元本: ${this.currency(totalContributed, { compact: true })}`,
      `最終資産: ${this.currency(totalValue, { compact: true })}`,
      `利益: ${this.currency(profit, { compact: true })} (${this.percentage(profitRate)})`
    ].join(' | ')
  }

  /**
   * 入力値の正規化（文字列から数値への変換）
   * @param input 入力文字列
   * @param type 期待する数値タイプ
   * @returns 正規化された数値
   */
  static normalize(input: string, type: 'currency' | 'percentage' | 'number'): number {
    // 全角数字を半角に変換
    const halfWidth = input.replace(/[０-９]/g, (char) => 
      String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    )
    
    // カンマや円マーク等を除去
    let cleaned = halfWidth.replace(/[,¥\\円%％]/g, '')
    
    // パーセンテージの場合は100で割る
    if (type === 'percentage') {
      const numValue = parseFloat(cleaned)
      return isNaN(numValue) ? 0 : numValue / 100
    }
    
    const numValue = parseFloat(cleaned)
    return isNaN(numValue) ? 0 : numValue
  }

  /**
   * 数値の妥当性チェック
   * @param value チェックする値
   * @returns 有効な数値かどうか
   */
  static isValid(value: number): boolean {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value)
  }

  /**
   * 安全な数値変換（デフォルト値付き）
   * @param value 変換する値
   * @param defaultValue デフォルト値
   * @returns 安全に変換された数値
   */
  static safe(value: unknown, defaultValue: number = 0): number {
    if (typeof value === 'number' && this.isValid(value)) {
      return value
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (this.isValid(parsed)) {
        return parsed
      }
    }
    
    return defaultValue
  }
}