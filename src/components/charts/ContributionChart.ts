import { Chart } from 'chart.js'
import type { YearlyContribution } from '@/types/investment'
import { ChartConfigManager } from '@/utils/chartConfig'
import { NumberFormatter } from '@/utils/formatter'
import { APP_CONFIG, DEV_CONFIG } from '@/data/defaults'

/**
 * 年次別寄与度線グラフコンポーネント
 * sample/02_sample_02.png の実装
 */
export class ContributionChart {
  private container: HTMLElement
  private canvas!: HTMLCanvasElement
  private chart: Chart<'line'> | null = null
  private resizeObserver: ResizeObserver | null = null

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
    // 既存のcanvasを探すか新規作成
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
    
    // アクセシビリティ属性設定
    this.canvas.setAttribute('role', 'img')
    this.canvas.setAttribute('aria-label', '年次別寄与度チャート')
  }

  /**
   * チャート初期化
   */
  private initializeChart(): void {
    const config = ChartConfigManager.getContributionChartConfig()
    
    try {
      this.chart = new Chart(this.canvas, config)
      
      if (DEV_CONFIG.debug) {
        console.log('✅ 寄与度チャート初期化完了')
      }
    } catch (error) {
      console.error('❌ 寄与度チャート初期化エラー:', error)
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
   update(yearlyContributions: YearlyContribution[], params?: { annualRate: number }): void {
     if (!this.chart) {
       console.error('❌ チャートが初期化されていません')
       return
     }

     try {
       const chartData = this.prepareChartData(yearlyContributions, params?.annualRate || 0.05)
       
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
       
       // カスタム凡例生成を削除（この行を削除）
       // this.generateCustomLegend(chartData.datasets)
       
       // アクセシビリティ更新
       this.updateAccessibility(yearlyContributions)
       
       if (DEV_CONFIG.debug) {
         console.log('📊 寄与度チャート更新完了:', {
           dataPoints: yearlyContributions.length,
           maxContribution: Math.max(...yearlyContributions.map(y => y.contribution))
         })
       }
     } catch (error) {
       console.error('❌ 寄与度チャート更新エラー:', error)
       this.showChartError('チャートの更新に失敗しました')
     }
   }

  /**
   * チャートデータ準備
   */
  private prepareChartData(yearlyContributions: YearlyContribution[], annualRate: number) {
    // X軸ラベル（年数）
    const labels = yearlyContributions.map(y => y.year)
    
    // 各年の積立が最終資産に与える寄与度のライン
    const contributionLines = this.generateContributionLines(yearlyContributions, annualRate)
    
    return {
      labels,
      datasets: contributionLines
    }
  }

  /**
   * 寄与度ライン生成
   * sample/02_sample_02.pngに倣って、各年の積立が時間とともに成長する線を表示
   */
  private generateContributionLines(yearlyContributions: YearlyContribution[], annualRate: number) {
    const colors = ChartConfigManager.generateColorPalette(yearlyContributions.length)
    const datasets = []
    
    // 各積立年について、その年から最終年までの成長線を表示
    for (let startYear = 1; startYear <= yearlyContributions.length; startYear++) {
      const lineData = []
      const annualAmount = yearlyContributions[startYear - 1]?.annualAmount || 0
      
      for (let displayYear = 1; displayYear <= yearlyContributions.length; displayYear++) {
        if (displayYear < startYear) {
          // 積立開始前は null（表示しない）
          lineData.push(null)
        } else {
          // その年の積立のdisplayYear時点での成長価値
          const yearsGrown = displayYear - startYear
          const currentValue = this.calculateCompoundValue(annualAmount, annualRate, yearsGrown)
          lineData.push(currentValue)
        }
      }
      
      // ラインの透明度を調整（後の年ほど薄く）
      const alpha = Math.max(0.4, 1 - (startYear - 1) * 0.6 / yearlyContributions.length)
      
      datasets.push({
        label: `${startYear}年目積立`,
        data: lineData,
        borderColor: colors.borderColor[startYear - 1],
        backgroundColor: ChartConfigManager.hexToRgba(colors.borderColor[startYear - 1], alpha * 0.2),
        borderWidth: startYear <= 5 ? 2 : 1, // 初期の年は太く
        pointRadius: 0, // 常時非表示
        pointHoverRadius: 1, // ホバー時も非表示
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0, // ポイントボーダーも非表示
        showLine: true, // 線は表示
        tension: 0.2, // 滑らかな成長曲線
        fill: false,
        spanGaps: false // null値をスキップして線を描画
      })
    }
    
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
    // 成長期間0年の場合は元本のまま
    if (years === 0 || isNaN(years)) {
      return principal
    }
    return principal * Math.pow(1 + rate, years)
  }

  /**
   * 個別年の成長価値計算
   */
  /* private calculateGrowthValue(annualAmount: number, remainingYears: number, rate: number): number {
    if (remainingYears <= 0) return annualAmount
    return annualAmount * Math.pow(1 + rate, remainingYears)
  } */

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
  private updateAccessibility(yearlyContributions: YearlyContribution[]): void {
    const totalYears = yearlyContributions.length
    const maxContribution = Math.max(...yearlyContributions.map(y => y.contribution))
    const maxContributionYear = yearlyContributions.find(y => y.contribution === maxContribution)?.year || 1
    
    const description = [
      `${totalYears}年間の積立投資における年次別寄与度を表示。`,
      `最大寄与度は${maxContributionYear}年目の${NumberFormatter.currency(maxContribution, { compact: true })}。`,
      `各線は積立開始年から最終年までの成長過程を示す。`
    ].join(' ')
    
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
  exportAsImage(filename = 'contribution-chart.png'): void {
    if (!this.chart) return
    
    const link = document.createElement('a')
    link.download = filename
    link.href = this.chart.toBase64Image()
    link.click()
  }

  /**
   * データをCSVとして出力
   */
  exportAsCSV(yearlyContributions: YearlyContribution[], filename = 'contribution-data.csv'): void {
    const headers = ['年', '年間積立額', '最終寄与額']
    const rows = yearlyContributions.map(y => [
      y.year,
      y.annualAmount,
      y.contribution
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.download = filename
    link.href = URL.createObjectURL(blob)
    link.click()
    
    URL.revokeObjectURL(link.href)
  }

  /**
   * 詳細情報表示
   */
  showDetails(yearlyContributions: YearlyContribution[]): void {
    const details = yearlyContributions.map(y => ({
      year: y.year,
      contribution: NumberFormatter.currency(y.contribution),
      percentage: ((y.contribution / yearlyContributions.reduce((sum, item) => sum + item.contribution, 0)) * 100).toFixed(1) + '%'
    }))
    
    console.table(details)
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
     
     // 既存の凡例コンテナがあれば削除
     const legendContainer = document.getElementById('contribution-legend-container')
     if (legendContainer) {
       legendContainer.remove()
     }
     
     if (DEV_CONFIG.debug) {
       console.log('🗑️ 寄与度チャート破棄完了')
     }
   }
}