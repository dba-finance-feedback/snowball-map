# 技術設計書 - 積立投資可視化ツール

## システム全体アーキテクチャ

### アーキテクチャ概要
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
├─────────────────────────────────────────────────────────────┤
│  UI Layer          │  Chart Layer        │  Calc Layer      │
│  - InputForm       │  - ContributionChart│  - Calculator    │
│  - Controls        │  - GrowthChart      │  - DataProcessor │
├─────────────────────────────────────────────────────────────┤
│                    Core TypeScript Engine                   │
├─────────────────────────────────────────────────────────────┤
│                    Vite Build System                        │
├─────────────────────────────────────────────────────────────┤
│                    GitHub Pages Hosting                     │
└─────────────────────────────────────────────────────────────┘
```

## 技術スタック詳細

### フロントエンド
- **言語**: TypeScript 5.0+
- **ビルドツール**: Vite 4.0+
- **チャートライブラリ**: Chart.js 4.0+ + chartjs-adapter-date-fns
- **スタイリング**: CSS3 (Custom Properties + Grid/Flexbox)
- **デプロイ**: GitHub Pages + GitHub Actions

### 開発環境
- **Node.js**: 18.0+
- **パッケージマネージャ**: npm
- **リンター**: ESLint + Prettier
- **型チェック**: TypeScript strict mode

## コアモジュール設計

### 1. 計算エンジン (`utils/calculator.ts`)

```typescript
interface InvestmentParams {
  monthlyAmount: number;      // 月次積立額
  annualRate: number;         // 年利率 (0.05 = 5%)
  years: number;              // 積立期間（年）
}

interface YearlyContribution {
  year: number;               // 積立開始年
  monthlyAmount: number;      // その年の月次積立額
  totalContributed: number;   // 元本累計
  currentValue: number;       // 現在価値
  contribution: number;       // 最終資産への寄与度
}

class InvestmentCalculator {
  // 年次別寄与度計算
  calculateYearlyContributions(params: InvestmentParams): YearlyContribution[]
  
  // 総資産計算
  calculateTotalValue(params: InvestmentParams): number
  
  // 複利計算
  compoundInterest(principal: number, rate: number, years: number): number
}
```

### 2. チャート設定 (`utils/chartConfig.ts`)

```typescript
interface ChartConfigOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  locale: 'ja-JP';
  currency: 'JPY';
}

class ChartConfigManager {
  // 寄与度線グラフ設定
  getContributionChartConfig(): Chart.Configuration
  
  // 成長積み上げエリアチャート設定  
  getGrowthChartConfig(): Chart.Configuration
  
  // 共通スタイル設定
  getCommonStyles(): ChartOptions
}
```

### 3. UI コンポーネント

#### InputForm (`components/InputForm.ts`)
```typescript
class InputForm {
  private container: HTMLElement;
  private onUpdate: (params: InvestmentParams) => void;
  
  constructor(container: HTMLElement, callback: Function)
  render(): void
  getValues(): InvestmentParams
  validate(): boolean
}
```

#### チャートコンポーネント (`components/Charts/`)
```typescript
abstract class BaseChart {
  protected canvas: HTMLCanvasElement;
  protected chart: Chart;
  
  constructor(container: HTMLElement)
  abstract updateData(data: any[]): void
  destroy(): void
}

class ContributionChart extends BaseChart {
  // 年次別寄与度線グラフ
  updateData(contributions: YearlyContribution[]): void
}

class GrowthChart extends BaseChart {
  // 積み上げ成長エリアチャート
  updateData(growthData: GrowthData[]): void
}
```

## データフロー

### 1. 初期化フロー
```
App Start → Default Params → Calculate → Render Charts → Show UI
```

### 2. ユーザー入力フロー
```
Input Change → Validate → Calculate → Update Charts → Update Summary
```

### 3. データ変換フロー
```
InvestmentParams → Calculator → YearlyContribution[] → Chart Data → Render
```

## パフォーマンス設計

### 計算最適化
- **遅延計算**: 入力変更から300ms後に計算実行
- **メモ化**: 同一パラメータの計算結果をキャッシュ
- **差分更新**: チャートデータの差分のみ更新

### レンダリング最適化
- **仮想化**: 長期間データは表示範囲のみレンダリング
- **アニメーション制御**: 不要なアニメーションを無効化
- **レスポンシブ**: ブレークポイント対応

## セキュリティ設計

### 入力値検証
```typescript
const VALIDATION_RULES = {
  monthlyAmount: { min: 1000, max: 10000000 },
  annualRate: { min: 0.0001, max: 0.3 },  // 0.01%から30%
  years: { min: 1, max: 50 }
};
```

### XSS対策
- 全ての動的コンテンツをサニタイズ
- innerHTML使用禁止、textContentを使用

## 国際化設計

### 日本語対応
```typescript
const LOCALE_CONFIG = {
  language: 'ja-JP',
  currency: 'JPY',
  numberFormat: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  dateFormat: 'YYYY年M月'
};
```

## エラーハンドリング

### エラー分類
1. **入力エラー**: バリデーション失敗
2. **計算エラー**: 数値オーバーフロー等
3. **レンダリングエラー**: Chart.js初期化失敗
4. **システムエラー**: 予期しないエラー

### エラー表示戦略
```typescript
interface ErrorDisplay {
  type: 'validation' | 'calculation' | 'system';
  message: string;
  recovery?: () => void;
}
```

## ビルド設定

### Vite設定 (`vite.config.ts`)
```typescript
export default defineConfig({
  base: '/snowball-map/',  // GitHub Pages用
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js'],
          'utils': ['date-fns']
        }
      }
    }
  }
});
```

### TypeScript設定 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

## デプロイ設定

### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
  
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/deploy-pages@v2
        with:
          artifact_name: github-pages
          path: ./dist
```

## 監視・メトリクス

### パフォーマンス指標
- **FCP (First Contentful Paint)**: < 2秒
- **LCP (Largest Contentful Paint)**: < 3秒  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

### 使用状況追跡（プライバシー配慮）
- Google Analytics不使用
- クライアントサイドのみで完結
- ユーザーデータの外部送信なし

## 拡張性設計

### 将来的な機能追加対応
- **新チャート種類**: プラグイン形式で追加可能
- **計算式変更**: Calculator クラスの拡張
- **多言語対応**: Locale設定の拡張
- **テーマ切替**: CSS Custom Properties活用

## 更新履歴
- 2025-08-12: 初版作成
- 2025-08-12: 入力値検証ルール更新（年利率の最小値を0.01%に変更）