import type { InvestmentResult } from '@/types/investment'
import { NumberFormatter } from '@/utils/formatter'

/**
 * 投資結果サマリー表示コンポーネント
 */
export class ResultSummary {
  private container: HTMLElement
  private currentResult: InvestmentResult | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.render()
  }

  /**
   * 初期HTML構造を生成
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="result-summary">
        <h2>計算結果</h2>
        
        <div class="summary-grid">
          <div class="summary-card primary">
            <div class="card-header">
              <h3>最終資産額</h3>
              <div class="card-icon">💰</div>
            </div>
            <div class="card-value" id="total-value">
              計算中...
            </div>
            <div class="card-subtitle" id="total-value-subtitle">
              
            </div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <h3>元本総額</h3>
              <div class="card-icon">💳</div>
            </div>
            <div class="card-value" id="total-contributed">
              -
            </div>
            <div class="card-subtitle" id="contribution-subtitle">
              
            </div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <h3>利益総額</h3>
              <div class="card-icon">📈</div>
            </div>
            <div class="card-value profit" id="total-profit">
              -
            </div>
            <div class="card-subtitle" id="profit-subtitle">
              
            </div>
          </div>

          <div class="summary-card">
            <div class="card-header">
              <h3>利益率</h3>
              <div class="card-icon">⚡</div>
            </div>
            <div class="card-value percentage" id="profit-rate">
              -
            </div>
            <div class="card-subtitle" id="rate-subtitle">
              
            </div>
          </div>
        </div>

        <div class="detailed-breakdown" id="detailed-breakdown">
          <h3>詳細内訳</h3>
          <div class="breakdown-content">
            <div class="breakdown-item">
              <span class="breakdown-label">年平均投資額:</span>
              <span class="breakdown-value" id="avg-annual">-</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">複利効果:</span>
              <span class="breakdown-value" id="compound-effect">-</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">実効年利:</span>
              <span class="breakdown-value" id="effective-rate">-</span>
            </div>
          </div>
        </div>

        <div class="performance-indicators" id="performance-indicators">
          <h3>投資パフォーマンス</h3>
          <div class="indicators-grid">
            <div class="indicator">
              <div class="indicator-label">投資期間</div>
              <div class="indicator-value" id="investment-period">-</div>
            </div>
            <div class="indicator">
              <div class="indicator-label">年次収益率</div>
              <div class="indicator-value" id="annual-return">-</div>
            </div>
            <div class="indicator">
              <div class="indicator-label">最大寄与年</div>
              <div class="indicator-value" id="max-contribution-year">-</div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * 投資結果を更新表示
   */
  update(result: InvestmentResult): void {
    this.currentResult = result
    this.updateMainValues(result)
    this.updateDetailedBreakdown(result)
    this.updatePerformanceIndicators(result)
    this.addAnimationEffect()
  }

  /**
   * メイン数値の更新
   */
  private updateMainValues(result: InvestmentResult): void {
    // 最終資産額
    const totalValueElement = document.getElementById('total-value')
    const totalValueSubtitle = document.getElementById('total-value-subtitle')
    if (totalValueElement) {
      totalValueElement.textContent = NumberFormatter.currency(result.totalValue, { compact: true })
    }
    if (totalValueSubtitle) {
      totalValueSubtitle.textContent = `詳細: ${NumberFormatter.currency(result.totalValue)}`
    }

    // 元本総額
    const totalContributedElement = document.getElementById('total-contributed')
    const contributionSubtitle = document.getElementById('contribution-subtitle')
    if (totalContributedElement) {
      totalContributedElement.textContent = NumberFormatter.currency(result.totalContributed, { compact: true })
    }
    if (contributionSubtitle) {
      const annualAmount = result.totalContributed / result.yearlyContributions.length
      contributionSubtitle.textContent = `年額 ${NumberFormatter.currency(annualAmount, { compact: true })}`
    }

    // 利益総額
    const totalProfitElement = document.getElementById('total-profit')
    const profitSubtitle = document.getElementById('profit-subtitle')
    if (totalProfitElement) {
      totalProfitElement.textContent = NumberFormatter.currency(result.totalProfit, { compact: true })
      totalProfitElement.className = result.totalProfit >= 0 ? 'card-value profit positive' : 'card-value profit negative'
    }
    if (profitSubtitle) {
      profitSubtitle.textContent = `複利効果による増加分`
    }

    // 利益率
    const profitRateElement = document.getElementById('profit-rate')
    const rateSubtitle = document.getElementById('rate-subtitle')
    if (profitRateElement) {
      profitRateElement.textContent = NumberFormatter.percentage(result.profitRate, 1)
      profitRateElement.className = result.profitRate >= 0 ? 'card-value percentage positive' : 'card-value percentage negative'
    }
    if (rateSubtitle) {
      const years = result.yearlyContributions.length
      const annualizedReturn = years > 0 ? Math.pow(result.totalValue / result.totalContributed, 1 / years) - 1 : 0
      rateSubtitle.textContent = `年平均 ${NumberFormatter.percentage(annualizedReturn, 2)}`
    }
  }

  /**
   * 詳細内訳の更新
   */
  private updateDetailedBreakdown(result: InvestmentResult): void {
    const years = result.yearlyContributions.length
    const avgAnnual = years > 0 ? result.totalContributed / years : 0
    
    // 年平均投資額
    const avgAnnualElement = document.getElementById('avg-annual')
    if (avgAnnualElement) {
      avgAnnualElement.textContent = NumberFormatter.currency(avgAnnual)
    }

    // 複利効果（単利との差）
    const compoundEffectElement = document.getElementById('compound-effect')
    if (compoundEffectElement) {
      const simpleInterest = result.totalContributed // 単利計算（0%として）
      const compoundEffect = result.totalValue - simpleInterest
      compoundEffectElement.textContent = NumberFormatter.currency(compoundEffect, { compact: true })
    }

    // 実効年利
    const effectiveRateElement = document.getElementById('effective-rate')
    if (effectiveRateElement) {
      if (years > 0 && result.totalContributed > 0) {
        const effectiveRate = Math.pow(result.totalValue / result.totalContributed, 1 / years) - 1
        effectiveRateElement.textContent = NumberFormatter.percentage(effectiveRate, 2)
      } else {
        effectiveRateElement.textContent = '0.0%'
      }
    }
  }

  /**
   * パフォーマンス指標の更新
   */
  private updatePerformanceIndicators(result: InvestmentResult): void {
    const years = result.yearlyContributions.length

    // 投資期間
    const investmentPeriodElement = document.getElementById('investment-period')
    if (investmentPeriodElement) {
      investmentPeriodElement.textContent = `${years}年間`
    }

    // 年次収益率（概算）
    const annualReturnElement = document.getElementById('annual-return')
    if (annualReturnElement) {
      if (years > 0) {
        const totalReturn = result.profitRate
        const annualReturn = Math.pow(1 + totalReturn, 1 / years) - 1
        annualReturnElement.textContent = NumberFormatter.percentage(annualReturn, 2)
      } else {
        annualReturnElement.textContent = '0.00%'
      }
    }

    // 最大寄与年
    const maxContributionYearElement = document.getElementById('max-contribution-year')
    if (maxContributionYearElement && result.yearlyContributions.length > 0) {
      const maxContribution = Math.max(...result.yearlyContributions.map(y => y.contribution))
      const maxYear = result.yearlyContributions.find(y => y.contribution === maxContribution)
      if (maxYear) {
        maxContributionYearElement.textContent = `${maxYear.year}年目`
      }
    }
  }

  /**
   * 更新時のアニメーション効果
   */
  private addAnimationEffect(): void {
    const cards = this.container.querySelectorAll('.summary-card')
    cards.forEach((card, index) => {
      card.classList.add('updating')
      setTimeout(() => {
        card.classList.remove('updating')
      }, 100 + index * 50)
    })
  }

  /**
   * エラー状態の表示
   */
  showError(message: string): void {
    this.container.innerHTML = `
      <div class="result-summary error">
        <h2>計算結果</h2>
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-message">${message}</div>
          <div class="error-help">
            入力値を確認して、再度お試しください。
          </div>
        </div>
      </div>
    `
  }

  /**
   * ローディング状態の表示
   */
  showLoading(): void {
    const valueElements = this.container.querySelectorAll('.card-value')
    valueElements.forEach(element => {
      element.textContent = '計算中...'
      element.classList.add('loading')
    })
  }

  /**
   * ローディング状態をクリア
   */
  hideLoading(): void {
    const valueElements = this.container.querySelectorAll('.card-value')
    valueElements.forEach(element => {
      element.classList.remove('loading')
    })
  }

  /**
   * サマリーデータの取得（他コンポーネントからの参照用）
   */
  getCurrentSummary(): {
    totalValue: string
    totalContributed: string
    totalProfit: string
    profitRate: string
  } | null {
    if (!this.currentResult) return null

    return {
      totalValue: NumberFormatter.currency(this.currentResult.totalValue),
      totalContributed: NumberFormatter.currency(this.currentResult.totalContributed),
      totalProfit: NumberFormatter.currency(this.currentResult.totalProfit),
      profitRate: NumberFormatter.percentage(this.currentResult.profitRate)
    }
  }

  /**
   * コンポーネントのクリア
   */
  clear(): void {
    this.currentResult = null
    this.render()
  }
}