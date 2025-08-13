import type { 
  InvestmentParams, 
  AppConfig 
} from '@/types/investment'

/**
 * デフォルト投資パラメータ
 * 一般的な積立投資のモデルケースとして設定
 */
export const DEFAULT_INVESTMENT_PARAMS: InvestmentParams = {
  monthlyAmount: 33333,    // 月3万円（年40万円）
  annualRate: 0.05,        // 年利5%（インデックス投資の長期平均的リターン）
  years: 30                // 30年間（若年層からの長期投資を想定）
}

/**
 * アプリケーション設定
 */
export const APP_CONFIG: AppConfig = {
  locale: 'ja-JP',
  currency: 'JPY',
  decimalPlaces: {
    currency: 0,      // 円は小数点なし
    percentage: 1     // パーセンテージは小数点1桁
  },
  chart: {
    colors: [
      // 寄与度チャート用カラーパレット（年次別）
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
      '#84cc16', '#eab308', '#22d3ee', '#a855f7', '#fb7185',
      '#4ade80', '#fbbf24', '#60a5fa', '#34d399', '#fcd34d',
      '#f87171', '#c084fc', '#fb923c', '#38bdf8', '#4ade80',
      '#facc15', '#f472b6', '#818cf8', '#2dd4bf', '#fb7185'
    ],
    animation: true   // チャートアニメーション有効
  }
}

/**
 * 一般的な投資シナリオのプリセット
 */
export const INVESTMENT_PRESETS = {
  conservative: {
    name: '保守的シナリオ',
    params: {
      monthlyAmount: 20000,
      annualRate: 0.02,  // 2%に調整
      years: 25
    },
    description: '低リスク・低リターンの安定運用'
  },
  
  standard: {
    name: '標準シナリオ', 
    params: DEFAULT_INVESTMENT_PARAMS,
    description: 'インデックス投資による標準的な長期運用'
  },
  
  aggressive: {
    name: '積極的シナリオ',
    params: {
      monthlyAmount: 50000,
      annualRate: 0.07,
      years: 35
    },
    description: '高リスク・高リターンを狙った積極運用'
  },
  
  young_starter: {
    name: '若年層スタート',
    params: {
      monthlyAmount: 10000,
      annualRate: 0.06,
      years: 40
    },
    description: '20代からの少額長期投資'
  },
  
  middle_age: {
    name: '中年層投資',
    params: {
      monthlyAmount: 80000,
      annualRate: 0.04,
      years: 15
    },
    description: '40代からの資産形成加速'
  }
} as const

/**
 * 計算精度設定
 */
export const CALCULATION_CONFIG = {
  // 浮動小数点の計算精度
  decimalPrecision: 10,
  
  // 計算結果の丸め方式
  roundingMode: 'round' as const, // 'round' | 'floor' | 'ceil'
  
  // 最大計算可能年数
  maxYears: 50,
  
  // 最大月次積立額（計算オーバーフロー防止）
  maxMonthlyAmount: 10000000,
  
  // 利率の計算精度（小数点以下何桁まで）
  ratePrecision: 6
}

/**
 * UI設定
 */
export const UI_CONFIG = {
  // デバウンス時間（ms）
  inputDebounceMs: 300,
  
  // チャート更新時のアニメーション時間（ms）
  chartAnimationMs: 750,
  
  // レスポンシブブレークポイント
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },
  
  // チャートのデフォルト高さ
  chartHeight: {
    mobile: 300,
    tablet: 400,
    desktop: 450
  }
}

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  required: '必須項目です',
  invalidNumber: '有効な数値を入力してください',
  outOfRange: '指定された範囲内で入力してください',
  calculationError: '計算エラーが発生しました',
  chartError: 'チャートの表示でエラーが発生しました',
  networkError: 'ネットワークエラーが発生しました'
} as const

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  calculationComplete: '計算が完了しました',
  dataUpdated: 'データが更新されました',
  settingsSaved: '設定が保存されました'
} as const

/**
 * ツールチップメッセージ
 */
export const TOOLTIP_MESSAGES = {
  monthlyAmount: '毎月積み立てる金額を入力してください（1,000円〜10,000,000円）',
  annualRate: '想定する年間利回りを入力してください（-10%〜30%）',
  years: '積立を継続する期間を入力してください（1年〜50年）',
  totalValue: '積立期間終了時点での資産総額',
  totalProfit: '元本に対する利益額',
  profitRate: '投資による利益率',
  contributionChart: '各年に積み立てた資金が最終資産に与える影響を表示',
  growthChart: '積立資産の経年変化を年次別に色分けして表示'
} as const

/**
 * LocalStorage用のキー定義
 */
export const STORAGE_KEYS = {
  lastParams: 'snowball_map_last_params',
  userSettings: 'snowball_map_user_settings',
  chartPreferences: 'snowball_map_chart_preferences'
} as const

/**
 * 開発環境設定
 */
export const DEV_CONFIG = {
  // デバッグモード（本番では false）
  debug: process.env.NODE_ENV === 'development',
  
  // コンソールログ出力レベル
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  
  // パフォーマンス測定
  measurePerformance: process.env.NODE_ENV === 'development'
} as const