# 積立投資可視化ツール - 作業計画書

## プロジェクト概要

**プロジェクト名**: 積立投資寄与度可視化ツール（Snowball Map）
**目的**: 積み立てた時期ごとの予想資産額への寄与度を可視化するWebツール
**公開方法**: GitHub Pages（無料）
**技術スタック**: Vite + TypeScript + Chart.js

## 作業フェーズ

### Phase 1: 環境構築 ✅ **完了** (2025-08-12)
- [x] Viteプロジェクト初期化
- [x] TypeScript設定
- [x] 依存関係インストール（Chart.js等）
- [ ] GitHub Actions設定 *(Phase 6で実装)*
- [x] 基本的なプロジェクト構造作成

**実装済み**:
- `package.json`, `tsconfig.json`, `vite.config.ts`
- `index.html`, `src/main.ts`, `src/style.css`
- ディレクトリ構造: `src/{types,utils,components,data}`
- 開発サーバー動作確認済み

### Phase 2: 計算ロジック実装 ✅ **完了** (2025-08-12)
- [x] 投資計算関数の実装
  - [x] 複利計算
  - [x] 年次別寄与度計算
  - [x] 元本・利益分離計算
  - [x] 月次複利計算（より正確な計算）
- [x] TypeScript型定義作成
- [x] 入力値バリデーション機能
- [x] 数値フォーマッター実装
- [x] デフォルト値・設定管理
- [ ] 単体テスト作成（Phase 5で実装）

**実装済み**:
- `src/types/investment.ts` - 完全な型定義
- `src/utils/calculator.ts` - 投資計算エンジン
- `src/utils/validator.ts` - バリデーション機能
- `src/utils/formatter.ts` - 日本語フォーマッター
- `src/data/defaults.ts` - 設定・プリセット
- TypeScriptコンパイル確認済み

### Phase 3: UI実装 ✅ **完了** (2025-08-12)
- [x] 入力フォーム作成
  - [x] 月次積立額
  - [x] 想定年利
  - [x] 積立期間
  - [x] リアルタイムバリデーション
  - [x] プリセット機能（5つのシナリオ）
- [x] 結果サマリーコンポーネント
  - [x] 4つの主要指標カード表示
  - [x] 詳細内訳・パフォーマンス指標
  - [x] アニメーション効果
- [x] レスポンシブデザイン実装
  - [x] モバイル/タブレット/デスクトップ対応
  - [x] ダークモード対応（CSS準備）
- [x] 日本語UI対応
- [x] メインアプリケーション統合
- [x] エラーハンドリング・ローディング状態

**実装済み**:
- `src/components/InputForm.ts` - 完全な入力フォーム
- `src/components/ResultSummary.ts` - 結果表示コンポーネント
- `src/main.ts` - アプリケーション統合
- `src/style.css` - 完全なレスポンシブCSS
- TypeScript・ビルド・開発サーバー動作確認済み

### Phase 4: チャート実装 ✅ **完了** (2025-08-12)
- [x] Chart.js設定・プラグイン登録
- [x] 寄与度線グラフ実装（sample/02_sample_02.png参考）
  - [x] 年次別寄与度可視化
  - [x] 複数線グラフ表示
  - [x] レスポンシブ対応
- [x] 積立成長スタックエリアチャート実装（sample/01_sample_01.png参考）
  - [x] 積み上げエリア表示
  - [x] 総資産推移ライン
  - [x] 年次別色分け
- [x] インタラクティブ機能追加
  - [x] ホバーツールチップ
  - [x] チャートエクスポート機能
  - [x] キーボードショートカット
- [x] チャート統合・メインアプリケーション連携

**実装済み**:
- `src/utils/chartConfig.ts` - Chart.js設定管理
- `src/components/charts/ContributionChart.ts` - 寄与度線グラフ
- `src/components/charts/GrowthChart.ts` - 成長積み上げチャート
- `src/main.ts` - チャート統合（更新）
- TypeScript・ビルド・開発サーバー動作確認済み
- バンドルサイズ: **201KB** (Chart.js込み)

### Phase 5: 統合・テスト ✅ **完了** (2025-08-12)
- [x] チャート表示問題診断・修正
  - [x] LineController未登録エラー解決
  - [x] チャート高さ・レイアウト問題修正
  - [x] 無限エラーループ修正
  - [x] レスポンシブ対応強化
- [x] 全機能統合・動作確認
- [x] データフロー・パラメータ渡し確認
- [x] デバッグユーティリティ追加
- [ ] クロスブラウザテスト（次フェーズ）
- [ ] パフォーマンステスト（次フェーズ）

**実装済み**:
- チャート表示問題完全解決
- 年次別寄与度チャート・資産成長チャート正常動作
- `src/utils/chartDebug.ts` - デバッグユーティリティ追加
- HTML・CSS・Chart.js統合完了
- デスクトップ・モバイル動作確認済み

### Phase 6: デプロイ・公開 (1時間)
- [ ] GitHub Pages設定確認
- [ ] ビルド確認
- [ ] 本番環境テスト
- [ ] ドキュメント更新

## 技術要件

### 必須要件
- Vite + TypeScript環境
- Chart.js v4以上
- レスポンシブデザイン
- GitHub Pages対応

### 推奨要件
- PWA対応（オフライン使用）
- ダークモード対応
- 計算結果のURL共有機能

## ファイル構成計画

```
/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .github/workflows/deploy.yml
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── types/
│   │   └── investment.ts
│   ├── utils/
│   │   ├── calculator.ts
│   │   └── chartConfig.ts
│   ├── components/
│   │   ├── InputForm.ts
│   │   ├── ContributionChart.ts
│   │   └── GrowthChart.ts
│   └── data/
│       └── defaultValues.ts
├── public/
│   └── favicon.ico
└── doc/
    ├── work-plan.md
    ├── technical-design.md
    ├── functional-spec.md
    └── implementation-guide.md
```

## リスク管理

### 技術リスク
- **Chart.js日本語対応**: 日本語フォント・日付フォーマット対応確認必要
- **GitHub Pages制限**: 静的サイトのみ、サーバーサイド処理不可

### 対応策
- Chart.js代替案としてD3.js検討
- 全てクライアントサイド計算で対応

## 成功指標

### 技術指標
- ページロード時間 < 3秒
- モバイル対応スコア > 90
- TypeScriptエラー 0件

### 機能指標
- 計算結果の正確性（手動検証）
- チャートの視認性（サンプル画像との一致度）
- ユーザビリティ（直感的な操作性）

## 次のアクション

1. **technical-design.md** - 詳細技術設計
2. **functional-spec.md** - 機能仕様詳細
3. **implementation-guide.md** - 実装手順ガイド
4. プロジェクト初期化実行

## 更新履歴

- 2025-08-12: 初版作成
- 2025-08-12: Phase 1完了 - 環境構築・プロジェクト初期化
- 2025-08-12: Phase 2完了 - 計算ロジック・型定義・バリデーション
- 2025-08-12: Phase 3完了 - UI実装・レスポンシブ・統合
- 2025-08-12: Phase 4完了 - Chart.js統合・チャート実装・インタラクティブ機能
- 2025-08-12: Phase 5完了 - チャート表示問題修正・統合テスト・デバッグ強化