# 実装ガイドライン - 積立投資可視化ツール

## 実装フロー

### Phase 1: プロジェクト初期化

#### 1.1 Viteプロジェクト作成
```bash
npm create vite@latest . -- --template typescript
npm install
```

#### 1.2 依存関係インストール  
```bash
# Chart.js関連
npm install chart.js chartjs-adapter-date-fns date-fns

# 開発依存関係
npm install -D @types/node eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
```

#### 1.3 設定ファイル作成

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/snowball-map/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js', 'chartjs-adapter-date-fns'],
          'utils': ['date-fns']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
```

**tsconfig.json** (修正):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Phase 2: 基本構造作成

#### 2.1 ディレクトリ構成
```
src/
├── main.ts              # エントリーポイント
├── style.css           # グローバルスタイル
├── types/
│   └── investment.ts    # 型定義
├── utils/
│   ├── calculator.ts    # 計算エンジン
│   ├── chartConfig.ts   # Chart.js設定
│   └── formatter.ts     # 数値フォーマット
├── components/
│   ├── InputForm.ts     # 入力フォーム
│   ├── ResultSummary.ts # 結果サマリー
│   └── charts/
│       ├── ContributionChart.ts  # 寄与度チャート
│       └── GrowthChart.ts        # 成長チャート
└── data/
    └── defaults.ts      # デフォルト値
```

#### 2.2 型定義作成 (`src/types/investment.ts`)

```typescript
export interface InvestmentParams {
  monthlyAmount: number;    // 月次積立額
  annualRate: number;       // 年利率 (小数点: 0.05 = 5%)
  years: number;            // 積立期間
}

export interface YearlyContribution {
  year: number;             // 積立年 (1-based)
  monthlyAmount: number;    // 月次積立額
  annualAmount: number;     // 年間積立額
  totalContributed: number; // その年までの累積元本
  currentValue: number;     // 最終時点での価値
  contribution: number;     // 最終資産への寄与額
}

export interface InvestmentResult {
  totalValue: number;           // 最終資産総額
  totalContributed: number;     // 元本総額
  totalProfit: number;          // 利益総額
  profitRate: number;           // 利益率
  yearlyContributions: YearlyContribution[];
}

export interface ChartDataPoint {
  x: number;                    // X軸値
  y: number;                    // Y軸値
  label?: string;               // ラベル
}

export interface ValidationError {
  field: keyof InvestmentParams;
  message: string;
}
```

### Phase 3: 計算エンジン実装

#### 3.1 Calculator実装 (`src/utils/calculator.ts`)

```typescript
import type { InvestmentParams, InvestmentResult, YearlyContribution } from '../types/investment.ts';

export class InvestmentCalculator {
  /**
   * 投資結果を計算
   */
  calculate(params: InvestmentParams): InvestmentResult {
    const yearlyContributions = this.calculateYearlyContributions(params);
    
    const totalValue = yearlyContributions.reduce((sum, year) => sum + year.currentValue, 0);
    const totalContributed = params.monthlyAmount * 12 * params.years;
    const totalProfit = totalValue - totalContributed;
    const profitRate = totalContributed > 0 ? totalProfit / totalContributed : 0;

    return {
      totalValue,
      totalContributed,
      totalProfit,
      profitRate,
      yearlyContributions
    };
  }

  /**
   * 年次別寄与度計算
   */
  private calculateYearlyContributions(params: InvestmentParams): YearlyContribution[] {
    const { monthlyAmount, annualRate, years } = params;
    const contributions: YearlyContribution[] = [];

    for (let year = 1; year <= years; year++) {
      const annualAmount = monthlyAmount * 12;
      const remainingYears = years - year;
      
      // その年の積立が最終時点で持つ価値
      const currentValue = this.calculateFutureValue(
        annualAmount, 
        annualRate, 
        remainingYears
      );

      contributions.push({
        year,
        monthlyAmount,
        annualAmount,
        totalContributed: annualAmount * year,
        currentValue,
        contribution: currentValue
      });
    }

    return contributions;
  }

  /**
   * 将来価値計算 (複利)
   */
  private calculateFutureValue(
    presentValue: number, 
    rate: number, 
    periods: number
  ): number {
    if (rate === 0) return presentValue;
    return presentValue * Math.pow(1 + rate, periods);
  }

  /**
   * 入力値検証
   */
  validate(params: InvestmentParams): ValidationError[] {
    const errors: ValidationError[] = [];

    if (params.monthlyAmount < 1000 || params.monthlyAmount > 10000000) {
      errors.push({
        field: 'monthlyAmount',
        message: '月次積立額は1,000円〜10,000,000円の範囲で入力してください'
      });
    }

    if (params.annualRate < 0.0001 || params.annualRate > 0.3) {
      errors.push({
        field: 'annualRate', 
        message: '想定年利は0.01%〜30%の範囲で入力してください'
      });
    }

    if (params.years < 1 || params.years > 50) {
      errors.push({
        field: 'years',
        message: '積立期間は1年〜50年の範囲で入力してください'  
      });
    }

    return errors;
  }
}
```

#### 3.2 フォーマッター実装 (`src/utils/formatter.ts`)

```typescript
export class NumberFormatter {
  private static locale = 'ja-JP';
  
  /**
   * 通貨フォーマット
   */
  static currency(value: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  }

  /**
   * パーセンテージフォーマット
   */
  static percentage(value: number, decimals = 1): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * 数値フォーマット（3桁区切り）
   */
  static number(value: number): string {
    return new Intl.NumberFormat(this.locale).format(Math.round(value));
  }
}
```

### Phase 4: UI コンポーネント実装

#### 4.1 入力フォーム (`src/components/InputForm.ts`)

```typescript
import type { InvestmentParams, ValidationError } from '../types/investment.ts';

export class InputForm {
  private container: HTMLElement;
  private form: HTMLFormElement;
  private onUpdate: (params: InvestmentParams) => void;
  private debounceTimer: number = 0;

  constructor(container: HTMLElement, onUpdate: (params: InvestmentParams) => void) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="input-form">
        <h2>投資設定</h2>
        <form id="investment-form">
          <div class="form-group">
            <label for="monthly-amount">月次積立額 (円)</label>
            <input 
              type="number" 
              id="monthly-amount" 
              name="monthlyAmount"
              value="33333"
              min="1000" 
              max="10000000"
              step="1000"
              required
            >
            <div class="error-message" id="monthly-amount-error"></div>
          </div>

          <div class="form-group">
            <label for="annual-rate">想定年利 (%)</label>
            <input 
              type="number" 
              id="annual-rate" 
              name="annualRate"
              value="5.0"
              min="0.01" 
              max="30"
              step="0.1"
              required
            >
            <div class="error-message" id="annual-rate-error"></div>
          </div>

          <div class="form-group">
            <label for="years">積立期間 (年)</label>
            <input 
              type="number" 
              id="years" 
              name="years"
              value="30"
              min="1" 
              max="50"
              step="1"
              required
            >
            <div class="error-message" id="years-error"></div>
          </div>

          <button type="button" id="reset-button">初期値に戻す</button>
        </form>
      </div>
    `;

    this.form = this.container.querySelector('#investment-form') as HTMLFormElement;
  }

  private bindEvents(): void {
    // 入力値変更イベント (debounce付き)
    this.form.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleInputChange();
      }, 300);
    });

    // リセットボタン
    const resetButton = this.form.querySelector('#reset-button');
    resetButton?.addEventListener('click', () => {
      this.resetToDefaults();
    });
  }

  private handleInputChange(): void {
    const params = this.getValues();
    const errors = this.validateInputs(params);
    
    this.displayErrors(errors);
    
    if (errors.length === 0) {
      this.onUpdate(params);
    }
  }

  getValues(): InvestmentParams {
    const formData = new FormData(this.form);
    
    return {
      monthlyAmount: Number(formData.get('monthlyAmount')),
      annualRate: Number(formData.get('annualRate')) / 100, // %から小数点に変換
      years: Number(formData.get('years'))
    };
  }

  private validateInputs(params: InvestmentParams): ValidationError[] {
    // バリデーションロジック (Calculator.validate と連携)
    return [];
  }

  private displayErrors(errors: ValidationError[]): void {
    // エラーメッセージ表示
    errors.forEach(error => {
      const errorElement = document.getElementById(`${error.field}-error`);
      if (errorElement) {
        errorElement.textContent = error.message;
      }
    });
  }

  private resetToDefaults(): void {
    (this.form.querySelector('#monthly-amount') as HTMLInputElement).value = '33333';
    (this.form.querySelector('#annual-rate') as HTMLInputElement).value = '5.0';
    (this.form.querySelector('#years') as HTMLInputElement).value = '30';
    
    this.handleInputChange();
  }
}
```

### Phase 5: チャート実装指針

#### 5.1 Chart.js基本設定 (`src/utils/chartConfig.ts`)

```typescript
import type { ChartConfiguration } from 'chart.js';

export class ChartConfigManager {
  static getCommonConfig(): Partial<ChartConfiguration> {
    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.formattedValue}円`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true
            }
          },
          y: {
            display: true,
            title: {
              display: true
            },
            ticks: {
              callback: function(value) {
                return Number(value).toLocaleString() + '円';
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };
  }
}
```

### Phase 6: メインアプリケーション

#### 6.1 App クラス実装 (`src/main.ts`)

```typescript
import { InvestmentCalculator } from './utils/calculator.ts';
import { InputForm } from './components/InputForm.ts';
import { ResultSummary } from './components/ResultSummary.ts';
import { ContributionChart } from './components/charts/ContributionChart.ts';
import { GrowthChart } from './components/charts/GrowthChart.ts';
import type { InvestmentParams } from './types/investment.ts';

class App {
  private calculator: InvestmentCalculator;
  private inputForm: InputForm;
  private resultSummary: ResultSummary;
  private contributionChart: ContributionChart;
  private growthChart: GrowthChart;

  constructor() {
    this.calculator = new InvestmentCalculator();
    this.initializeComponents();
    this.calculateAndUpdate(this.getDefaultParams());
  }

  private initializeComponents(): void {
    // DOM要素の取得・作成
    const inputContainer = document.querySelector('#input-form')!;
    const summaryContainer = document.querySelector('#result-summary')!;
    const contributionChartContainer = document.querySelector('#contribution-chart')!;
    const growthChartContainer = document.querySelector('#growth-chart')!;

    // コンポーネント初期化
    this.inputForm = new InputForm(inputContainer as HTMLElement, (params) => {
      this.calculateAndUpdate(params);
    });

    this.resultSummary = new ResultSummary(summaryContainer as HTMLElement);
    this.contributionChart = new ContributionChart(contributionChartContainer as HTMLElement);
    this.growthChart = new GrowthChart(growthChartContainer as HTMLElement);
  }

  private calculateAndUpdate(params: InvestmentParams): void {
    const result = this.calculator.calculate(params);
    
    this.resultSummary.update(result);
    this.contributionChart.update(result.yearlyContributions);
    this.growthChart.update(result.yearlyContributions);
  }

  private getDefaultParams(): InvestmentParams {
    return {
      monthlyAmount: 33333,
      annualRate: 0.05,
      years: 30
    };
  }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
```

## 実装チェックリスト

### 環境構築
- [ ] Viteプロジェクト作成
- [ ] 依存関係インストール
- [ ] TypeScript設定
- [ ] ESLint/Prettier設定

### 基盤実装
- [ ] 型定義作成
- [ ] 計算エンジン実装
- [ ] バリデーション機能
- [ ] フォーマッター実装

### UI実装
- [ ] HTML構造作成
- [ ] CSS スタイリング
- [ ] 入力フォーム実装
- [ ] 結果サマリー表示

### チャート実装
- [ ] Chart.js設定
- [ ] 寄与度チャート実装
- [ ] 成長チャートの実装
- [ ] レスポンシブ対応

### 統合・テスト
- [ ] 全機能統合
- [ ] エラーハンドリング
- [ ] パフォーマンステスト
- [ ] クロスブラウザテスト

### デプロイ準備
- [ ] GitHub Actions設定
- [ ] ビルド設定確認
- [ ] 本番環境テスト

## 品質担保

### コード品質
- TypeScript strict mode有効
- ESLint ルール準拠
- 関数・クラスの単一責任原則
- 適切な型注釈

### パフォーマンス
- debounce による入力制御
- Chart.js の最適化設定
- 不要な再描画の回避
- メモリリーク対策

### 保守性
- コンポーネント分割
- 設定の外部化
- エラーハンドリングの統一
- ドキュメント整備

## トラブルシューティング

### よくある問題

1. **Chart.js が表示されない**
   - canvas要素のサイズ設定確認
   - Chart.js のバージョン互換性確認

2. **計算結果が不正確**
   - 数値の精度（floating point）に注意
   - 境界値でのテスト実施

3. **モバイルでの表示崩れ**
   - viewport設定確認
   - touch イベント対応

4. **GitHub Pages で動作しない**
   - base URL 設定確認
   - 相対パス・絶対パスの使い分け

## 更新履歴
- 2025-08-12: 初版作成
- 2025-08-12: 年利率入力の最小値を0.01%に変更（0%入力問題の解決）