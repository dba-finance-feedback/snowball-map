import { Chart } from 'chart.js'
import type { YearlyContribution, InvestmentParams } from '@/types/investment'
import { ChartConfigManager } from '@/utils/chartConfig'
import { NumberFormatter } from '@/utils/formatter'
import { APP_CONFIG, DEV_CONFIG } from '@/data/defaults'

/**
 * 積立資産成長積み上げエリアチャート
 * sample/01_sample_01.png の実装
 */
export class GrowthChart {
  private container: HTMLElement
  private canvas!: HTMLCanvasElement
  private chart: Chart<'line'> | null = null
  private resizeObserver: ResizeObserver | null = null
  private currentParams: InvestmentParams | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.setupCanvas()
    this.initializeChart()
    this.setupResizeObserver()
  }

  /**
   * Canvas要素のセットアップ
   */
  private setupCanvas(): void {
    let existingCanvas = this.container.querySelector('canvas')
    
    if (existingCanvas) {
      this.canvas = existingCanvas
    } else {
      this.canvas = document.createElement('canvas')
      this.container.appendChild(this.canvas)
    }
    
    // Canvas設定
    this.canvas.style.display = 'block'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    
    this.canvas.setAttribute('role', 'img')
    this.canvas.setAttribute('aria-label', '積立資産成長チャート')
  }

  /**
   * チャート初期化
   */
  private initializeChart(): void {
    const config = ChartConfigManager.getGrowthChartConfig()
    
    try {
      this.chart = new Chart(this.canvas, config)
      
      if (DEV_CONFIG.debug) {
        console.log('✅ 成長チャート初期化完了')
      }
    } catch (error) {
      console.error('❌ 成長チャート初期化エラー:', error)
      this.showChartError('チャートの初期化に失敗しました')
    }
  }

  /**
   * リサイズ監視設定
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize()
      })
      this.resizeObserver.observe(this.container)
    }
  }

  /**
   * データ更新
   */
  update(yearlyContributions: YearlyContribution[], params: InvestmentParams): void {
    if (!this.chart) {
      console.error('❌ チャートが初期化されていません')
      return
    }

    this.currentParams = params

    try {
      const chartData = this.prepareGrowthData(yearlyContributions, params)
      
      // データ更新
      this.chart.data = chartData
      
      // レスポンシブ設定更新
      const containerWidth = this.container.offsetWidth
      const responsiveConfig = ChartConfigManager.getResponsiveConfig(containerWidth)
      
      if (this.chart.options) {
        Object.assign(this.chart.options, responsiveConfig)
      }
      
      // チャート再描画
      this.chart.update(APP_CONFIG.chart.animation ? 'active' : 'none')
      
      // アクセシビリティ更新
      this.updateAccessibility(yearlyContributions, params)
      
      if (DEV_CONFIG.debug) {
        console.log('📈 成長チャート更新完了:', {
          years: params.years,
          finalValue: yearlyContributions.reduce((sum, y) => sum + y.contribution, 0)
        })
      }
    } catch (error) {
      console.error('❌ 成長チャート更新エラー:', error)
      this.showChartError('チャートの更新に失敗しました')
    }
  }

  /**
   * 成長データ準備
   * 各年の積立が時間経過とともにどう成長するかを積み上げで表示
   */
  private prepareGrowthData(yearlyContributions: YearlyContribution[], params: InvestmentParams) {
    // X軸ラベル（経過年数）
    const labels = Array.from({ length: params.years }, (_, i) => i + 1)
    
    // 積み上げデータセット生成（sample/01_sample_01.png準拠）
    const datasets = this.generateStackedAreaDatasets(yearlyContributions, params)
    
    return {
      labels,
      datasets
    }
  }

  /**
   * 積み上げエリアデータセット生成（sample/01_sample_01.png準拠）
   */
  private generateStackedAreaDatasets(_yearlyContributions: YearlyContribution[], params: InvestmentParams) {
    const datasets = []
    
    // 各年の積立を個別のエリアデータセットとして作成
    for (let contributionYear = 1; contributionYear <= params.years; contributionYear++) {
      const areaData = []
      
      for (let currentYear = 1; currentYear <= params.years; currentYear++) {
        if (currentYear < contributionYear) {
          // 積立開始前は 0
          areaData.push(0)
        } else {
          // その年の積立のcurrentYear時点での価値（単体値）
          const yearsGrown = currentYear - contributionYear
          const annualAmount = params.monthlyAmount * 12
          const currentValue = annualAmount * Math.pow(1 + params.annualRate, yearsGrown)
          areaData.push(currentValue)
        }
      }
      
      // 年次別寄与度と同じ色設定を使用
      const colors = ChartConfigManager.generateColorPalette(params.years)
      const baseColor = colors.borderColor[contributionYear - 1]
      
      // 透明度を統一（後の年も薄くしない）
      const alpha = 0.3 // 一定の透明度で統一
      
      datasets.push({
        label: `${contributionYear}年目`,
        data: areaData,
        backgroundColor: ChartConfigManager.hexToRgba(baseColor, alpha),
        borderColor: ChartConfigManager.hexToRgba(baseColor, alpha),
        borderWidth: 0.1, // より細いボーダー
        fill: 'origin',
        tension: 0.1,
        pointRadius: 0, // 常時非表示
        pointHoverRadius: 4, // ホバー時のみ表示
        pointBackgroundColor: ChartConfigManager.hexToRgba(baseColor, alpha),
        pointBorderColor: baseColor,
        // pointBackgroundColor: baseColor,
        // pointBorderColor: '#ffffff',
        pointBorderWidth: 0, // ポイントボーダーも非表示
        pointStyle: false, // ポイントスタイル無効
        showLine: true, // 線は表示
        order: contributionYear, // 年数順
        stack: 'stack1' // 同じスタックに積み上げ
      })
    }
    
    // 元本累計ライン（赤いライン・直線）を追加
    const principalData = []
    for (let currentYear = 1; currentYear <= params.years; currentYear++) {
      // 元本累計 = 月次積立額 × 12 × 経過年数
      const principalTotal = params.monthlyAmount * 12 * currentYear
      principalData.push(principalTotal)
    }
    
    datasets.push({
      type: 'line',
      label: '積立総額（元本）',
      data: principalData,
      borderColor: '#000000', // 黒い線に変更
      backgroundColor: 'transparent',
      borderWidth: 6, // 太い線
      fill: false,
      tension: 0, // 直線
      pointRadius: 0, // 常時非表示
      pointHoverRadius: 8, // ホバー時のみ表示
      pointBackgroundColor: '#000000',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 0, // ポイントボーダーも非表示
      pointStyle: false, // ポイントスタイル無効
      showLine: true, // 線は表示
      order: 0, // 最前面に表示
      stack: 'line', // 独立したスタック
      // 線を際立たせるための効果
      borderCapStyle: 'round',
      borderJoinStyle: 'round'
    } as any)
    
    return datasets
  }

  /**
   * 複利価値計算
   */
  private calculateCompoundValue(principal: number, rate: number, years: number): number {
    // NaN/undefined/無効値の場合はデフォルト値を使用
    if (isNaN(rate) || rate === null || rate === undefined) {
      rate = 0.01 // 1%をデフォルトに
    }
    if (years === 0) return principal
    return principal * Math.pow(1 + rate, years)
  }

  /**
   * 積み上げ効果の可視化強化
   * 実際の積み上げ効果を正しく表現するため、累積値で計算
   */
  /* private generateCumulativeDatasets(yearlyContributions: YearlyContribution[], params: InvestmentParams) {
    const datasets = []
    const colors = ChartConfigManager.generateColorPalette(params.years)
    
    // 累積資産額の計算
    const cumulativeData: number[][] = Array(params.years).fill(0).map(() => Array(params.years).fill(0))
    
    // 各年での累積値を計算
    for (let currentYear = 1; currentYear <= params.years; currentYear++) {
      let cumulative = 0
      
      for (let contributionYear = 1; contributionYear <= currentYear; contributionYear++) {
        const yearsGrown = currentYear - contributionYear
        const value = this.calculateCompoundValue(
          params.monthlyAmount * 12,
          params.annualRate,
          yearsGrown
        )
        cumulative += value
        cumulativeData[contributionYear - 1][currentYear - 1] = cumulative
      }
    }
    
    // データセット作成（積み上げ効果を表現）
    for (let contributionYear = 1; contributionYear <= params.years; contributionYear++) {
      const shouldDisplay = contributionYear <= 10 || contributionYear % 5 === 0
      
      if (shouldDisplay) {
        const data = []
        
        for (let currentYear = 1; currentYear <= params.years; currentYear++) {
          if (currentYear < contributionYear) {
            data.push(0)
          } else {
            // この年の積立分のみの寄与
            const thisYearValue = this.calculateCompoundValue(
              params.monthlyAmount * 12,
              params.annualRate,
              currentYear - contributionYear
            )
            data.push(thisYearValue)
          }
        }
        
        datasets.push({
          label: `${contributionYear}年目の積立`,
          data: data,
          backgroundColor: colors.backgroundColor[contributionYear - 1],
          borderColor: colors.borderColor[contributionYear - 1],
          borderWidth: 1,
          fill: 'origin',
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4
        })
      }
    }
    
    return datasets
  } */

  /**
   * 総資産推移ライン追加
   */
  addTotalAssetLine(_yearlyContributions: YearlyContribution[], params: InvestmentParams): void {
    if (!this.chart) return
    
    const totalAssetData = []
    
    for (let currentYear = 1; currentYear <= params.years; currentYear++) {
      let totalValue = 0
      
      for (let contributionYear = 1; contributionYear <= currentYear; contributionYear++) {
        const yearsGrown = currentYear - contributionYear
        const value = this.calculateCompoundValue(
          params.monthlyAmount * 12,
          params.annualRate,
          yearsGrown
        )
        totalValue += value
      }
      
      totalAssetData.push(totalValue)
    }
    
    // 総資産ラインを追加
    this.chart.data.datasets.push({
      type: 'line',
      label: '総資産額',
      data: totalAssetData,
      borderColor: '#ef4444',
      backgroundColor: 'transparent',
      borderWidth: 3,
      fill: false,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#ef4444',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      order: 0  // 最前面に表示
    } as any)
    
    this.chart.update('none')
  }

  /**
   * リサイズ処理
   */
  private handleResize(): void {
    if (!this.chart) return
    
    const containerWidth = this.container.offsetWidth
    const responsiveConfig = ChartConfigManager.getResponsiveConfig(containerWidth)
    
    if (this.chart.options) {
      Object.assign(this.chart.options, responsiveConfig)
      this.chart.resize()
    }
  }

  /**
   * アクセシビリティ更新
   */
  private updateAccessibility(yearlyContributions: YearlyContribution[], params: InvestmentParams): void {
    const totalValue = yearlyContributions.reduce((sum, y) => sum + y.contribution, 0)
    const totalContributed = params.monthlyAmount * 12 * params.years
    const profit = totalValue - totalContributed
    
    const description = [
      `${params.years}年間の積立投資成長を積み上げ表示。`,
      `最終資産額${NumberFormatter.currency(totalValue, { compact: true })}`,
      `（元本${NumberFormatter.currency(totalContributed, { compact: true })}、`,
      `利益${NumberFormatter.currency(profit, { compact: true })}）。`,
      `各エリアは年次別積立の成長を表す。`
    ].join('')
    
    this.canvas.setAttribute('aria-label', description)
  }

  /**
   * エラー表示
   */
  private showChartError(message: string): void {
    this.container.innerHTML = `
      <div class="chart-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button class="retry-button" onclick="location.reload()">
          再試行
        </button>
      </div>
    `
  }

  /**
   * チャート画像として出力
   */
  exportAsImage(filename = 'growth-chart.png'): void {
    if (!this.chart) return
    
    const link = document.createElement('a')
    link.download = filename
    link.href = this.chart.toBase64Image()
    link.click()
  }

  /**
   * 成長分析データ出力
   */
  exportGrowthAnalysis(yearlyContributions: YearlyContribution[], params: InvestmentParams): void {
    if (!this.currentParams) return
    
    const analysis = {
      投資期間: `${params.years}年`,
      月次積立額: NumberFormatter.currency(params.monthlyAmount),
      想定年利: NumberFormatter.percentage(params.annualRate),
      最終資産額: NumberFormatter.currency(yearlyContributions.reduce((sum, y) => sum + y.contribution, 0)),
      元本総額: NumberFormatter.currency(params.monthlyAmount * 12 * params.years),
      利益総額: NumberFormatter.currency(yearlyContributions.reduce((sum, y) => sum + y.contribution, 0) - params.monthlyAmount * 12 * params.years),
      各年別寄与度: yearlyContributions.map(y => ({
        年: y.year,
        寄与額: NumberFormatter.currency(y.contribution),
        割合: ((y.contribution / yearlyContributions.reduce((sum, item) => sum + item.contribution, 0)) * 100).toFixed(1) + '%'
      }))
    }
    
    console.log('📊 成長分析レポート:', analysis)
  }

  /**
   * コンポーネント破棄
   */
  destroy(): void {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    
    this.currentParams = null
    
    if (DEV_CONFIG.debug) {
      console.log('🗑️ 成長チャート破棄完了')
    }
  }
}