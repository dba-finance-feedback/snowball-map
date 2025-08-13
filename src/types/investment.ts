/**
 * 投資パラメータ
 */
export interface InvestmentParams {
  monthlyAmount: number;    // 月次積立額（円）
  annualRate: number;       // 年利率（小数点: 0.05 = 5%）
  years: number;            // 積立期間（年）
}

/**
 * 年次別積立寄与度
 */
export interface YearlyContribution {
  year: number;             // 積立年（1年目、2年目...）
  monthlyAmount: number;    // その年の月次積立額
  annualAmount: number;     // その年の年間積立額
  totalContributed: number; // その年までの累積元本
  currentValue: number;     // 最終時点でのその年の積立価値
  contribution: number;     // 最終資産への寄与額（currentValueと同値）
}

/**
 * 投資計算結果
 */
export interface InvestmentResult {
  totalValue: number;           // 最終資産総額
  totalContributed: number;     // 元本総額
  totalProfit: number;          // 利益総額
  profitRate: number;           // 利益率（小数点）
  yearlyContributions: YearlyContribution[];  // 年次別詳細
}

/**
 * チャート用データポイント
 */
export interface ChartDataPoint {
  x: number;                    // X軸値（年）
  y: number;                    // Y軸値（金額）
  label?: string;               // ラベル（オプション）
}

/**
 * 入力値検証エラー
 */
export interface ValidationError {
  field: keyof InvestmentParams;
  message: string;
  value?: number;               // エラーとなった値
}

/**
 * 入力値の制約
 */
export interface InputConstraints {
  monthlyAmount: {
    min: number;
    max: number;
    step: number;
  };
  annualRate: {
    min: number;    // -10% = -0.1
    max: number;    // 30% = 0.3
    step: number;
  };
  years: {
    min: number;
    max: number;
    step: number;
  };
}

/**
 * 成長段階別データ（スタックエリアチャート用）
 */
export interface GrowthStageData {
  year: number;                 // 経過年数
  stages: {
    yearContributed: number;    // その年に積み立てた年
    value: number;              // その年の積立の現在価値
    accumulated: number;        // 累積値（スタック用）
  }[];
}

/**
 * アプリケーション設定
 */
export interface AppConfig {
  locale: string;               // 'ja-JP'
  currency: string;             // 'JPY'
  decimalPlaces: {
    currency: number;           // 通貨の小数点以下桁数
    percentage: number;         // パーセンテージの小数点以下桁数
  };
  chart: {
    colors: string[];           // チャート色配列
    animation: boolean;         // アニメーション有効/無効
  };
}