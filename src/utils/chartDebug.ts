import { Chart } from 'chart.js'
import { DEV_CONFIG } from '@/data/defaults'

/**
 * チャートデバッグ用ユーティリティ
 */
export class ChartDebugger {
  /**
   * 簡単なテストチャートを作成してChart.jsの動作確認
   */
  static createTestChart(container: HTMLElement): Chart | null {
    if (!DEV_CONFIG.debug) return null
    
    const canvas = document.createElement('canvas')
    canvas.style.border = '2px solid red'
    container.appendChild(canvas)
    
    try {
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: ['1年目', '2年目', '3年目', '4年目', '5年目'],
          datasets: [{
            label: 'テストデータ',
            data: [100000, 150000, 200000, 300000, 500000],
            borderColor: '#ff0000',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '🔧 Chart.js テスト'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
      
      console.log('✅ テストチャート作成成功', chart)
      return chart
    } catch (error) {
      console.error('❌ テストチャート作成失敗:', error)
      return null
    }
  }

  /**
   * チャートの診断情報を出力
   */
  static diagnoseChart(chart: Chart | null, name: string): void {
    if (!DEV_CONFIG.debug) return
    
    console.group(`🔍 ${name} 診断`)
    
    if (!chart) {
      console.error('❌ チャートが null です')
      console.groupEnd()
      return
    }
    
    console.log('📊 チャート情報:', {
      type: (chart.config as any).type,
      canvas: chart.canvas,
      ctx: chart.ctx,
      data: chart.data,
      options: chart.options
    })
    
    console.log('📋 データセット数:', chart.data.datasets?.length || 0)
    console.log('📊 データポイント数:', chart.data.labels?.length || 0)
    
    if (chart.data.datasets) {
      chart.data.datasets.forEach((dataset, index) => {
        console.log(`📈 Dataset ${index}:`, {
          label: dataset.label,
          dataLength: Array.isArray(dataset.data) ? dataset.data.length : 'N/A',
          type: dataset.type,
          hidden: dataset.hidden
        })
      })
    }
    
    console.groupEnd()
  }

  /**
   * Chart.js環境の確認
   */
  static checkEnvironment(): void {
    if (!DEV_CONFIG.debug) return
    
    console.group('🔧 Chart.js 環境診断')
    
    try {
      console.log('📦 Chart.js バージョン:', Chart.version)
      console.log('🏗️ Chart.js コンストラクタ:', typeof Chart)
      console.log('🎨 登録済みプラグイン:', Object.keys((Chart.registry.plugins as any).items || {}))
      console.log('📊 登録済みスケール:', Object.keys((Chart.registry.scales as any).items || {}))
      console.log('📈 登録済みチャートタイプ:', Object.keys((Chart.registry.controllers as any).items || {}))
    } catch (error) {
      console.error('❌ Chart.js環境エラー:', error)
    }
    
    console.groupEnd()
  }
}