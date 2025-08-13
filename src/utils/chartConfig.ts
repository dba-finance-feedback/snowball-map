import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
  type TooltipItem,
  type ChartOptions
} from 'chart.js'
import { NumberFormatter } from '@/utils/formatter'
import { APP_CONFIG } from '@/data/defaults'

// Chart.js プラグイン登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * Chart.js設定管理クラス
 * 共通設定とチャート固有設定を提供
 */
export class ChartConfigManager {
  /**
   * 共通チャート設定
   */
  static getCommonConfig(): Partial<ChartConfiguration> {
    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: APP_CONFIG.chart.animation ? 750 : 0,
          easing: 'easeInOutQuart'
        },
        datasets: {
          line: {
            pointRadius: 0, // 全てのlineチャートでポイント非表示
            pointHoverRadius: 5,
            pointBorderWidth: 0,
            pointStyle: false
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: false, // ポイントスタイルを無効化
              padding: 15,
              font: {
                family: 'system-ui, -apple-system, sans-serif',
                size: 12
              },
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: {
              size: 13,
              weight: 600
            },
            bodyFont: {
              size: 12
            },
            callbacks: {
              title: function(context: TooltipItem<any>[]) {
                if (context.length > 0) {
                  return `${context[0].label}年目`
                }
                return ''
              },
              label: function(context: TooltipItem<any>) {
                const value = context.parsed.y
                return `${context.dataset.label}: ${NumberFormatter.currency(value, { compact: true })}`
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(value: any) {
                return `${value}年目`
              }
            },
            title: {
              display: true,
              text: '積立年数',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          y: {
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(value: any) {
                return NumberFormatter.currency(value, { compact: true })
              }
            },
            title: {
              display: true,
              text: '金額（円）',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            }
          }
        }
      }
    }
  }

  /**
   * 寄与度線グラフの設定
   */
  static getContributionChartConfig(): ChartConfiguration<'line'> {
    const commonConfig = this.getCommonConfig()
    
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonConfig.options,
        plugins: {
          ...commonConfig.options?.plugins,
          title: {
            display: true,
            text: '積み立てた年ごとの寄与度',
            color: '#1e293b',
            font: {
              size: 16,
              weight: 600
            },
            padding: 20
          },
          legend: {
            ...commonConfig.options?.plugins?.legend,
            display: false  // 寄与度チャートは凡例非表示
          }
        },
        scales: {
          x: {
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(_value: any, index: number) {
                return `${index + 1}年目`
              }
            },
            title: {
              display: true,
              text: '積立年数',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            }
          },
          y: {
            type: 'linear',
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(value: any) {
                return NumberFormatter.currency(value, { compact: true })
              }
            },
            beginAtZero: true,
            title: {
              display: true,
              text: '最終資産への寄与額（円）',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            }
          }
        },
        elements: {
          line: {
            tension: 0.4,
            borderWidth: 3,
            fill: false
          },
          point: {
            radius: 0, // 常時非表示
            hoverRadius: 0, // ホバー時も非表示
            borderWidth: 0, // ボーダーも非表示
            backgroundColor: 'transparent', // 背景も透明
            pointStyle: false // ポイントスタイル無効
          }
        }
      }
    }
  }

  /**
   * 成長積み上げエリアチャートの設定
   */
  static getGrowthChartConfig(): ChartConfiguration<'line'> {
    const commonConfig = this.getCommonConfig()
    
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonConfig.options,
        plugins: {
          ...commonConfig.options?.plugins,
          title: {
            display: true,
            text: '積み立てた年ごとの全体への影響（積み上げグラフ）と元本累計（黒）',
            color: '#1e293b',
            font: {
              size: 14,
              weight: 600
            },
            padding: 20
          },
          legend: {
            ...commonConfig.options?.plugins?.legend,
            display: false, // 多数のデータセットがあるため凡例は非表示
            position: 'bottom'
          }
        },
        scales: {
          x: {
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(_value: any, index: number) {
                return `${index + 1}年目`
              }
            },
            title: {
              display: true,
              text: '経過年数',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            },
            stacked: true // 積み上げ有効
          },
          y: {
            type: 'linear',
            grid: {
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: function(value: any) {
                return NumberFormatter.currency(value, { compact: true })
              }
            },
            beginAtZero: true,
            stacked: true, // 積み上げ有効
            title: {
              display: true,
              text: '累積資産額（円）',
              color: '#475569',
              font: {
                size: 12,
                weight: 500
              }
            }
          }
        },
        elements: {
          line: {
            tension: 0.1,
            borderWidth: 2,
            fill: 'origin'
          },
          point: {
            radius: 0, // 常時非表示
            hoverRadius: 5, // ホバー時のみ表示
            borderWidth: 0, // ボーダーも非表示
            backgroundColor: 'transparent', // 背景も透明
            pointStyle: false // ポイントスタイル無効
          }
        }
      }
    }
  }

  /**
   * カラーパレット生成
   */
  static generateColorPalette(count: number): { backgroundColor: string[], borderColor: string[] } {
    const colors = APP_CONFIG.chart.colors
    const backgroundColor: string[] = []
    const borderColor: string[] = []

    for (let i = 0; i < count; i++) {
      const colorIndex = i % colors.length
      const baseColor = colors[colorIndex]
      
      // 透明度を調整してグラデーション効果
      const alpha = Math.max(0.1, 1 - (i * 0.8 / count))
      backgroundColor.push(this.hexToRgba(baseColor, alpha))
      borderColor.push(baseColor)
    }

    return { backgroundColor, borderColor }
  }

  /**
   * Hex色をRGBA形式に変換
   */
  static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /**
   * レスポンシブ対応設定
   */
  static getResponsiveConfig(containerWidth: number): Partial<ChartOptions> {
    if (containerWidth < 768) {
      // モバイル設定
      return {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              font: { size: 10 }
            }
          },
          title: {
            font: { size: 14 }
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 6,
              font: { size: 10 }
            },
            title: {
              font: { size: 11 }
            }
          },
          y: {
            ticks: {
              maxTicksLimit: 5,
              font: { size: 10 }
            },
            title: {
              font: { size: 11 }
            }
          }
        }
      }
    } else if (containerWidth < 1024) {
      // タブレット設定
      return {
        plugins: {
          legend: {
            labels: {
              padding: 12,
              font: { size: 11 }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            ticks: {
              maxTicksLimit: 8
            }
          }
        }
      }
    }
    
    // デスクトップ設定（デフォルト）
    return {}
  }

  /**
   * アクセシビリティ設定
   */
  static getAccessibilityConfig(): Partial<ChartOptions> {
    return {
      plugins: {
        tooltip: {
          enabled: true,
          mode: 'index',
          position: 'nearest'
        }
      },
      hover: {
        mode: 'index',
        intersect: false
      }
    }
  }
}