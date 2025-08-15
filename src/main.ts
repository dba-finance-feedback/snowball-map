import './style.css'
import { InvestmentCalculator } from '@/utils/calculator'
import { InputForm } from '@/components/InputForm'
import { ResultSummary } from '@/components/ResultSummary'
import { ContributionChart } from '@/components/charts/ContributionChart'
import { GrowthChart } from '@/components/charts/GrowthChart'
import { DisclaimerModal } from '@/components/DisclaimerModal'
import type { InvestmentParams } from '@/types/investment'
import { DEFAULT_INVESTMENT_PARAMS, DEV_CONFIG } from '@/data/defaults'
import { ChartDebugger } from '@/utils/chartDebug'
import { Chart } from 'chart.js'

// Chart.jsのグローバル設定でポイントを完全に無効化
Chart.defaults.elements.point.radius = 0
Chart.defaults.elements.point.hoverRadius = 5
Chart.defaults.elements.point.borderWidth = 0

/**
 * メインアプリケーションクラス
 * 全コンポーネントを統合し、データフローを管理
 */
class SnowballMapApp {
  private calculator: InvestmentCalculator
  private inputForm: InputForm | null = null
  private resultSummary: ResultSummary | null = null
  private contributionChart: ContributionChart | null = null
  private growthChart: GrowthChart | null = null
  private disclaimerModal: DisclaimerModal | null = null

  constructor() {
    this.calculator = new InvestmentCalculator()
    this.initializeApp()
  }

  /**
   * アプリケーション初期化
   */
  private initializeApp(): void {
    console.log('🚀 Snowball Map - 積立投資可視化ツール起動開始')
    
    try {
      if (DEV_CONFIG.debug) {
        console.log('📊 Phase 5: チャート表示問題の修正・統合テスト中')
        ChartDebugger.checkEnvironment()
      }

      // DOM要素の確認
      console.log('🔍 DOM要素検証開始')
      if (!this.validateDOMElements()) {
        console.error('❌ 必要なDOM要素が見つかりません')
        this.showInitializationError()
        return
      }
      console.log('✅ DOM要素検証完了')
    } catch (error) {
      console.error('❌ アプリケーション初期化でエラー:', error)
      this.showInitializationError()
      return
    }

    // コンポーネント初期化
    this.initializeComponents()
    
    // 免責事項モーダル初期化
    this.initializeDisclaimer()
    
    // インタラクティブ機能設定
    this.setupInteractiveFeatures()
    
    // 初期計算実行
    this.calculateAndUpdate(DEFAULT_INVESTMENT_PARAMS)
    
    if (DEV_CONFIG.debug) {
      console.log('✅ アプリケーション初期化完了')
    }
  }

  /**
   * 必要なDOM要素の存在確認
   */
  private validateDOMElements(): boolean {
    const requiredElements = [
      '#input-form',
      '#result-summary',
      '#contribution-chart',
      '#growth-chart'
    ]

    console.log('🔍 DOM要素検証中...')
    let allElementsFound = true

    requiredElements.forEach(selector => {
      const element = document.querySelector(selector)
      if (!element) {
        console.error(`❌ DOM要素が見つかりません: ${selector}`)
        allElementsFound = false
      } else {
        console.log(`✅ DOM要素確認: ${selector}`, element)
      }
    })

    return allElementsFound
  }

  /**
   * 各コンポーネントを初期化
   */
  private initializeComponents(): void {
    try {
      console.log('🔧 コンポーネント初期化開始')
      
      // 入力フォーム初期化
      console.log('📝 入力フォーム初期化中...')
      const inputContainer = document.querySelector('#input-form') as HTMLElement
      this.inputForm = new InputForm(inputContainer, (params) => {
        this.handleParameterChange(params)
      })
      console.log('✅ 入力フォーム初期化完了')

      // 結果サマリー初期化
      console.log('📊 結果サマリー初期化中...')
      const summaryContainer = document.querySelector('#result-summary') as HTMLElement
      this.resultSummary = new ResultSummary(summaryContainer)
      console.log('✅ 結果サマリー初期化完了')

      // チャートコンポーネント初期化
      console.log('📈 寄与度チャート初期化中...')
      const contributionChartContainer = document.querySelector('#contribution-chart') as HTMLElement
      this.contributionChart = new ContributionChart(contributionChartContainer)
      console.log('✅ 寄与度チャート初期化完了')

      console.log('📈 成長チャート初期化中...')
      const growthChartContainer = document.querySelector('#growth-chart') as HTMLElement
      this.growthChart = new GrowthChart(growthChartContainer)
      console.log('✅ 成長チャート初期化完了')

      console.log('✅ 全コンポーネント初期化完了')
    } catch (error) {
      console.error('❌ コンポーネント初期化エラー:', error)
      console.error('エラー詳細:', error)
      this.showInitializationError()
    }
  }

  /**
   * パラメータ変更時の処理
   */
  private handleParameterChange(params: InvestmentParams): void {
    if (DEV_CONFIG.debug) {
      console.log('📈 パラメータ変更:', {
        annualAmount: params.annualAmount,
        annualRate: (params.annualRate * 100).toFixed(1) + '%',
        years: params.years
      })
    }

    this.calculateAndUpdate(params)
  }

  /**
   * 計算実行と結果更新
   */
  private calculateAndUpdate(params: InvestmentParams): void {
    const startTime = DEV_CONFIG.measurePerformance ? performance.now() : 0

    try {
      // ローディング状態表示
      this.resultSummary?.showLoading()
      
      // 投資計算実行
      const result = this.calculator.calculate(params)
      
      // 結果更新
      this.resultSummary?.update(result)
      
      // チャート更新
      this.contributionChart?.update(result.yearlyContributions, { annualRate: params.annualRate })
      this.growthChart?.update(result.yearlyContributions, params)
      
      if (DEV_CONFIG.measurePerformance) {
        const endTime = performance.now()
        console.log(`⚡ 計算処理時間: ${(endTime - startTime).toFixed(2)}ms`)
      }

      if (DEV_CONFIG.debug) {
        console.log('💰 計算結果:', {
          totalValue: result.totalValue.toLocaleString() + '円',
          totalProfit: result.totalProfit.toLocaleString() + '円',
          profitRate: (result.profitRate * 100).toFixed(1) + '%'
        })
      }

    } catch (error) {
      console.error('❌ 計算エラー:', error)
      this.resultSummary?.showError('計算処理でエラーが発生しました')
    }
  }

  /**
   * 免責事項モーダル初期化
   */
  private initializeDisclaimer(): void {
    try {
      this.disclaimerModal = new DisclaimerModal()
      
      // 初回訪問時の免責事項表示チェック
      this.disclaimerModal.checkFirstVisit()
      
      if (DEV_CONFIG.debug) {
        console.log('✅ 免責事項モーダル初期化完了')
      }
    } catch (error) {
      console.error('❌ 免責事項モーダル初期化エラー:', error)
    }
  }

  /**
   * インタラクティブ機能の追加
   */
  private setupInteractiveFeatures(): void {
    // チャート間の連携機能
    this.setupChartInteraction()
    
    // キーボードショートカット
    this.setupKeyboardShortcuts()
    
    // エクスポート機能
    this.setupExportFeatures()
  }

  /**
   * チャート間連携設定
   */
  private setupChartInteraction(): void {
    // 将来的な機能拡張用
    // 例：寄与度チャートの年をクリックすると成長チャートでハイライト
  }

  /**
   * キーボードショートカット設定
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + S でデータエクスポート
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        this.exportAllData()
      }
      
      // Ctrl/Cmd + P でチャート印刷
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault()
        window.print()
      }
    })
  }

  /**
   * エクスポート機能設定
   */
  private setupExportFeatures(): void {
    // データエクスポートボタンを動的に追加（オプション）
    if (DEV_CONFIG.debug) {
      const exportButton = document.createElement('button')
      exportButton.textContent = 'データエクスポート (Ctrl+S)'
      exportButton.className = 'btn btn-outline'
      exportButton.style.position = 'fixed'
      exportButton.style.bottom = '20px'
      exportButton.style.right = '20px'
      exportButton.style.zIndex = '1000'
      exportButton.onclick = () => this.exportAllData()
      
      document.body.appendChild(exportButton)
    }
  }

  /**
   * 全データエクスポート
   */
  private exportAllData(): void {
    if (!this.contributionChart || !this.growthChart) return
    
    const currentParams = this.inputForm?.getValues()
    if (!currentParams) return
    
    const result = this.calculator.calculate(currentParams)
    
    // チャート画像エクスポート
    this.contributionChart.exportAsImage(`寄与度チャート_${new Date().toISOString().split('T')[0]}.png`)
    this.growthChart.exportAsImage(`成長チャート_${new Date().toISOString().split('T')[0]}.png`)
    
    // データCSVエクスポート
    this.contributionChart.exportAsCSV(result.yearlyContributions, `投資データ_${new Date().toISOString().split('T')[0]}.csv`)
    
    if (DEV_CONFIG.debug) {
      console.log('📤 全データエクスポート完了')
    }
  }

  /**
   * 初期化エラー時の表示
   */
  private showInitializationError(): void {
    const appElement = document.querySelector('#app')
    if (appElement) {
      appElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 2rem;">
          <div style="font-size: 4rem; margin-bottom: 2rem;">⚠️</div>
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #ef4444;">アプリケーション初期化エラー</h1>
          <p style="color: #64748b; margin-bottom: 2rem;">アプリケーションの初期化中にエラーが発生しました。</p>
          <button onclick="location.reload()" style="
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.75rem 1.5rem; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 1rem;
          ">
            ページを再読み込み
          </button>
        </div>
      `
    }
  }

  /**
   * アプリケーション終了処理
   */
  destroy(): void {
    this.inputForm?.destroy()
    this.contributionChart?.destroy()
    this.growthChart?.destroy()
    this.disclaimerModal?.destroy()
    
    this.inputForm = null
    this.resultSummary = null
    this.contributionChart = null
    this.growthChart = null
    this.disclaimerModal = null
    
    if (DEV_CONFIG.debug) {
      console.log('🗑️ アプリケーション終了')
    }
  }
}

/**
 * DOMContentLoaded後にアプリケーション開始
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded イベント発火')
  
  try {
    // グローバルエラーハンドラー設定
    window.addEventListener('error', (event) => {
      console.error('❌ グローバルエラー:', event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ 未処理のPromise拒否:', event.reason)
    })

    console.log('🚀 アプリケーション開始')
    
    // アプリケーション開始
    const app = new SnowballMapApp()
    
    // デバッグ用にグローバルに公開
    if (DEV_CONFIG.debug) {
      ;(window as any).snowballApp = app
      console.log('🔧 デバッグモード: window.snowballApp で参照可能')
    }

    // ページアンロード時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      app.destroy()
    })

    console.log('✅ アプリケーション起動完了')

  } catch (error) {
    console.error('❌ アプリケーション起動エラー:', error)
    console.error('エラー詳細:', error)
    
    // 緊急表示
    const appElement = document.querySelector('#app')
    if (appElement) {
      appElement.innerHTML += `
        <div style="background: #fee2e2; color: #dc2626; padding: 1rem; margin: 1rem; border-radius: 6px;">
          <h3>⚠️ アプリケーション起動エラー</h3>
          <p>詳細はブラウザのコンソールを確認してください。</p>
          <pre>${error}</pre>
        </div>
      `
    }
  }
})