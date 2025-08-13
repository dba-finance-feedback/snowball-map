import type { InvestmentParams, ValidationError } from '@/types/investment'
import { InputValidator, INPUT_CONSTRAINTS } from '@/utils/validator'
import { NumberFormatter } from '@/utils/formatter'
import { DEFAULT_INVESTMENT_PARAMS, INVESTMENT_PRESETS, UI_CONFIG } from '@/data/defaults'

/**
 * 投資パラメータ入力フォームコンポーネント
 */
export class InputForm {
  private container: HTMLElement
  private form: HTMLFormElement | null = null
  private onUpdate: (params: InvestmentParams) => void
  private validator: InputValidator
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  constructor(container: HTMLElement, onUpdate: (params: InvestmentParams) => void) {
    this.container = container
    this.onUpdate = onUpdate
    this.validator = new InputValidator()
    this.render()
    this.bindEvents()
    
    // 初期値で計算実行
    this.triggerUpdate()
  }

  /**
   * フォームのHTML構造を生成・挿入
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="input-form">
        <h2>投資設定</h2>
        
        <form id="investment-form" novalidate>
          <div class="form-group">
            <label for="monthly-amount">
              月次積立額 <span class="unit">(円)</span>
            </label>
            <input 
              type="number" 
              id="monthly-amount" 
              name="monthlyAmount"
              value="${DEFAULT_INVESTMENT_PARAMS.monthlyAmount}"
              min="${INPUT_CONSTRAINTS.monthlyAmount.min}" 
              max="${INPUT_CONSTRAINTS.monthlyAmount.max}"
              step="${INPUT_CONSTRAINTS.monthlyAmount.step}"
              class="form-input"
              required
            >
            <div class="input-help">
              ${INPUT_CONSTRAINTS.monthlyAmount.min.toLocaleString()}円 〜 
              ${INPUT_CONSTRAINTS.monthlyAmount.max.toLocaleString()}円
            </div>
            <div class="error-message" id="monthly-amount-error"></div>
          </div>

          <div class="form-group">
            <label for="annual-rate">
              想定年利 <span class="unit">(%)</span>
            </label>
            <input 
              type="number" 
              id="annual-rate" 
              name="annualRate"
              value="${(DEFAULT_INVESTMENT_PARAMS.annualRate * 100).toFixed(1)}"
              min="${(INPUT_CONSTRAINTS.annualRate.min * 100).toFixed(1)}" 
              max="${(INPUT_CONSTRAINTS.annualRate.max * 100).toFixed(1)}"
              step="0.1"
              class="form-input"
              required
            >
            <div class="input-help">
              ${(INPUT_CONSTRAINTS.annualRate.min * 100).toFixed(2)}% 〜 
              ${(INPUT_CONSTRAINTS.annualRate.max * 100).toFixed(2)}%
            </div>
            <div class="error-message" id="annual-rate-error"></div>
          </div>

          <div class="form-group">
            <label for="years">
              積立期間 <span class="unit">(年)</span>
            </label>
            <input 
              type="number" 
              id="years" 
              name="years"
              value="${DEFAULT_INVESTMENT_PARAMS.years}"
              min="${INPUT_CONSTRAINTS.years.min}" 
              max="${INPUT_CONSTRAINTS.years.max}"
              step="${INPUT_CONSTRAINTS.years.step}"
              class="form-input"
              required
            >
            <div class="input-help">
              ${INPUT_CONSTRAINTS.years.min}年 〜 ${INPUT_CONSTRAINTS.years.max}年
            </div>
            <div class="error-message" id="years-error"></div>
          </div>

          <div class="form-actions">
            <button type="button" id="reset-button" class="btn btn-secondary">
              初期値に戻す
            </button>
            <div class="preset-dropdown">
              <button type="button" id="preset-button" class="btn btn-outline">
                プリセット ▼
              </button>
              <div class="preset-menu" id="preset-menu">
                ${Object.entries(INVESTMENT_PRESETS).map(([key, preset]) => `
                  <button type="button" class="preset-item" data-preset="${key}">
                    <div class="preset-name">${preset.name}</div>
                    <div class="preset-desc">${preset.description}</div>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </form>
        
        <div class="calculation-summary">
          <div class="summary-item">
            <span class="summary-label">年間積立額:</span>
            <span class="summary-value" id="annual-amount">
              ${NumberFormatter.currency(DEFAULT_INVESTMENT_PARAMS.monthlyAmount * 12)}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">総積立額:</span>
            <span class="summary-value" id="total-contribution">
              ${NumberFormatter.currency(DEFAULT_INVESTMENT_PARAMS.monthlyAmount * 12 * DEFAULT_INVESTMENT_PARAMS.years)}
            </span>
          </div>
        </div>
      </div>
    `

    this.form = this.container.querySelector('#investment-form') as HTMLFormElement
  }

  /**
   * イベントリスナーをバインド
   */
  private bindEvents(): void {
    if (!this.form) return

    // 入力値変更イベント（debounce付き）
    this.form.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement
      if (target.matches('.form-input')) {
        this.clearFieldError(target.name)
        this.updateCalculationSummary()
        
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer)
        }
        this.debounceTimer = setTimeout(() => {
          this.handleInputChange()
        }, UI_CONFIG.inputDebounceMs)
      }
    })

    // リセットボタン
    const resetButton = this.form.querySelector('#reset-button')
    resetButton?.addEventListener('click', () => {
      this.resetToDefaults()
    })

    // プリセット機能
    this.setupPresetHandlers()
  }

  /**
   * プリセット選択機能のセットアップ
   */
  private setupPresetHandlers(): void {
    const presetButton = this.form?.querySelector('#preset-button')
    const presetMenu = this.form?.querySelector('#preset-menu')

    presetButton?.addEventListener('click', () => {
      presetMenu?.classList.toggle('show')
    })

    // プリセット項目クリック
    presetMenu?.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const presetItem = target.closest('.preset-item') as HTMLElement
      
      if (presetItem) {
        const presetKey = presetItem.dataset.preset
        if (presetKey && presetKey in INVESTMENT_PRESETS) {
          this.applyPreset(presetKey as keyof typeof INVESTMENT_PRESETS)
          presetMenu.classList.remove('show')
        }
      }
    })

    // メニュー外クリックで閉じる
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target.closest('.preset-dropdown')) {
        presetMenu?.classList.remove('show')
      }
    })
  }

  /**
   * 入力変更の処理
   */
  private handleInputChange(): void {
    const params = this.getValues()
    const errors = this.validator.validate(params)
    
    this.displayErrors(errors)
    
    if (errors.filter(e => this.validator.getErrorSeverity(e) === 'error').length === 0) {
      this.onUpdate(params)
    }
  }

  /**
   * 現在の入力値を取得
   */
  getValues(): InvestmentParams {
    if (!this.form) {
      return DEFAULT_INVESTMENT_PARAMS
    }

    const formData = new FormData(this.form)
    
    return {
      monthlyAmount: NumberFormatter.safe(formData.get('monthlyAmount'), DEFAULT_INVESTMENT_PARAMS.monthlyAmount),
      annualRate: NumberFormatter.safe(formData.get('annualRate'), DEFAULT_INVESTMENT_PARAMS.annualRate * 100) / 100,
      years: NumberFormatter.safe(formData.get('years'), DEFAULT_INVESTMENT_PARAMS.years)
    }
  }

  /**
   * エラー表示
   */
  private displayErrors(errors: ValidationError[]): void {
    // 全エラー表示をクリア
    this.clearAllErrors()

    // 各エラーを表示
    errors.forEach(error => {
      const errorElement = document.getElementById(`${error.field}-error`)
      if (errorElement) {
        errorElement.textContent = error.message
        errorElement.className = `error-message ${this.validator.getErrorSeverity(error)}`
        
        // 入力フィールドのスタイル更新
        const inputElement = document.getElementById(this.getInputId(error.field))
        inputElement?.classList.add('error')
      }
    })
  }

  /**
   * フィールド固有エラーをクリア
   */
  private clearFieldError(fieldName: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`)
    if (errorElement) {
      errorElement.textContent = ''
      errorElement.className = 'error-message'
    }

    const inputElement = document.getElementById(this.getInputId(fieldName as keyof InvestmentParams))
    inputElement?.classList.remove('error')
  }

  /**
   * 全エラー表示をクリア
   */
  private clearAllErrors(): void {
    const errorElements = this.container.querySelectorAll('.error-message')
    errorElements.forEach(element => {
      element.textContent = ''
      element.className = 'error-message'
    })

    const inputElements = this.container.querySelectorAll('.form-input')
    inputElements.forEach(element => {
      element.classList.remove('error')
    })
  }

  /**
   * 計算サマリーの更新
   */
  private updateCalculationSummary(): void {
    const params = this.getValues()
    
    const annualAmountElement = document.getElementById('annual-amount')
    const totalContributionElement = document.getElementById('total-contribution')
    
    if (annualAmountElement) {
      annualAmountElement.textContent = NumberFormatter.currency(params.monthlyAmount * 12)
    }
    
    if (totalContributionElement) {
      totalContributionElement.textContent = NumberFormatter.currency(params.monthlyAmount * 12 * params.years)
    }
  }

  /**
   * 初期値に戻す
   */
  private resetToDefaults(): void {
    this.setValues(DEFAULT_INVESTMENT_PARAMS)
    this.clearAllErrors()
    this.triggerUpdate()
  }

  /**
   * プリセット適用
   */
  private applyPreset(presetKey: keyof typeof INVESTMENT_PRESETS): void {
    const preset = INVESTMENT_PRESETS[presetKey]
    this.setValues(preset.params)
    this.clearAllErrors()
    this.triggerUpdate()
  }

  /**
   * フォーム値を設定
   */
  private setValues(params: InvestmentParams): void {
    const monthlyAmountInput = document.getElementById('monthly-amount') as HTMLInputElement
    const annualRateInput = document.getElementById('annual-rate') as HTMLInputElement
    const yearsInput = document.getElementById('years') as HTMLInputElement

    if (monthlyAmountInput) monthlyAmountInput.value = params.monthlyAmount.toString()
    if (annualRateInput) annualRateInput.value = (params.annualRate * 100).toFixed(1)
    if (yearsInput) yearsInput.value = params.years.toString()

    this.updateCalculationSummary()
  }

  /**
   * 更新をトリガー
   */
  private triggerUpdate(): void {
    const params = this.getValues()
    this.onUpdate(params)
  }

  /**
   * フィールド名から入力要素IDを取得
   */
  private getInputId(field: keyof InvestmentParams): string {
    const mapping = {
      monthlyAmount: 'monthly-amount',
      annualRate: 'annual-rate',
      years: 'years'
    }
    return mapping[field]
  }

  /**
   * コンポーネントの破棄
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }
}