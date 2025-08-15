import type {
  InvestmentParams,
  ValidationError,
  InputConstraints
} from '@/types/investment'

/**
 * 入力値制約の定義
 */
export const INPUT_CONSTRAINTS: InputConstraints = {
  annualAmount: {
    min: 1000,       // 最小1,000円
    max: 100000000,   // 最大1億円
    step: 1000       // 1,000円単位
  },
  annualRate: {
    min: 0.0001,      // 最小0.01%
    max: 0.3,         // 最大30%
    step: 0.001       // 0.1%単位
  },
  years: {
    min: 1,           // 最小1年
    max: 50,          // 最大50年
    step: 1           // 1年単位
  }
}

/**
 * 入力値検証クラス
 */
export class InputValidator {
  /**
   * 投資パラメータの包括的検証
   * @param params 検証対象のパラメータ
   * @returns 検証エラーの配列（空配列は検証成功）
   */
  validate(params: InvestmentParams): ValidationError[] {
    const errors: ValidationError[] = []

    // 年次積立額の検証
    const annualAmountErrors = this.validateAnnualAmount(params.annualAmount)
    errors.push(...annualAmountErrors)

    // 年利率の検証
    const annualRateErrors = this.validateAnnualRate(params.annualRate)
    errors.push(...annualRateErrors)

    // 積立期間の検証
    const yearsErrors = this.validateYears(params.years)
    errors.push(...yearsErrors)

    // 論理的整合性の検証
    const logicalErrors = this.validateLogicalConsistency(params)
    errors.push(...logicalErrors)

    return errors
  }

  /**
   * 年次積立額の検証
   */
  private validateAnnualAmount(annualAmount: number): ValidationError[] {
    const errors: ValidationError[] = []
    const constraints = INPUT_CONSTRAINTS.annualAmount

    // 数値型チェック
    if (typeof annualAmount !== 'number' || isNaN(annualAmount)) {
      errors.push({
        field: 'annualAmount',
        message: '年次積立額は数値で入力してください',
        value: annualAmount
      })
      return errors
    }

    // 範囲チェック
    if (annualAmount < constraints.min) {
      errors.push({
        field: 'annualAmount',
        message: `年次積立額は${constraints.min.toLocaleString()}円以上で入力してください`,
        value: annualAmount
      })
    }

    if (annualAmount > constraints.max) {
      errors.push({
        field: 'annualAmount',
        message: `年次積立額は${constraints.max.toLocaleString()}円以下で入力してください`,
        value: annualAmount
      })
    }

    // 正の数チェック
    if (annualAmount <= 0) {
      errors.push({
        field: 'annualAmount',
        message: '年次積立額は正の値で入力してください',
        value: annualAmount
      })
    }

    return errors
  }

  /**
   * 年利率の検証
   */
  private validateAnnualRate(annualRate: number): ValidationError[] {
    const errors: ValidationError[] = []
    const constraints = INPUT_CONSTRAINTS.annualRate

    // 数値型チェック
    if (typeof annualRate !== 'number' || isNaN(annualRate)) {
      errors.push({
        field: 'annualRate',
        message: '想定年利は数値で入力してください',
        value: annualRate
      })
      return errors
    }

    // 範囲チェック
    if (annualRate < constraints.min) {
      errors.push({
        field: 'annualRate',
        message: `想定年利は${(constraints.min * 100).toFixed(1)}%以上で入力してください`,
        value: annualRate
      })
    }

    if (annualRate > constraints.max) {
      errors.push({
        field: 'annualRate',
        message: `想定年利は${(constraints.max * 100).toFixed(1)}%以下で入力してください`,
        value: annualRate
      })
    }

    // 極端な値の警告
    if (annualRate < -0.05) {  // -5%以下
      errors.push({
        field: 'annualRate',
        message: '想定年利が非常に低く設定されています。計算結果をご確認ください',
        value: annualRate
      })
    }

    if (annualRate > 0.15) {  // 15%以上
      errors.push({
        field: 'annualRate',
        message: '想定年利が非常に高く設定されています。現実的な値をご検討ください',
        value: annualRate
      })
    }

    return errors
  }

  /**
   * 積立期間の検証
   */
  private validateYears(years: number): ValidationError[] {
    const errors: ValidationError[] = []
    const constraints = INPUT_CONSTRAINTS.years

    // 数値型チェック
    if (typeof years !== 'number' || isNaN(years)) {
      errors.push({
        field: 'years',
        message: '積立期間は数値で入力してください',
        value: years
      })
      return errors
    }

    // 整数チェック
    if (!Number.isInteger(years)) {
      errors.push({
        field: 'years',
        message: '積立期間は整数で入力してください',
        value: years
      })
    }

    // 範囲チェック
    if (years < constraints.min) {
      errors.push({
        field: 'years',
        message: `積立期間は${constraints.min}年以上で入力してください`,
        value: years
      })
    }

    if (years > constraints.max) {
      errors.push({
        field: 'years',
        message: `積立期間は${constraints.max}年以下で入力してください`,
        value: years
      })
    }

    // 正の数チェック
    if (years <= 0) {
      errors.push({
        field: 'years',
        message: '積立期間は正の値で入力してください',
        value: years
      })
    }

    return errors
  }

  /**
   * 論理的整合性の検証
   */
  private validateLogicalConsistency(params: InvestmentParams): ValidationError[] {
    const errors: ValidationError[] = []

    // 総投資額の計算結果チェック
    const totalInvestment = params.annualAmount * params.years
    const maxReasonableInvestment = 100000000000  // 1000億円

    if (totalInvestment > maxReasonableInvestment) {
      errors.push({
        field: 'annualAmount',
        message: '総投資額が非常に大きくなります。現実的な値をご検討ください',
        value: totalInvestment
      })
    }

    // マイナス利率での長期投資の警告
    if (params.annualRate < 0 && params.years > 10) {
      errors.push({
        field: 'annualRate',
        message: 'マイナス利率での長期投資は元本割れのリスクが高くなります',
        value: params.annualRate
      })
    }

    return errors
  }

  /**
   * 単一フィールドの検証（リアルタイム検証用）
   */
  validateField(field: keyof InvestmentParams, value: number): ValidationError[] {
    const tempParams: InvestmentParams = {
      annualAmount: 400000,
      annualRate: 0.05,
      years: 30
    }
    
    tempParams[field] = value

    switch (field) {
      case 'annualAmount':
        return this.validateAnnualAmount(value)
      case 'annualRate':
        return this.validateAnnualRate(value)
      case 'years':
        return this.validateYears(value)
      default:
        return []
    }
  }

  /**
   * エラーメッセージの重要度判定
   */
  getErrorSeverity(error: ValidationError): 'error' | 'warning' | 'info' {
    const message = error.message.toLowerCase()
    
    if (message.includes('数値で入力') || 
        message.includes('以上で入力') || 
        message.includes('以下で入力') ||
        message.includes('正の値で入力')) {
      return 'error'
    }
    
    if (message.includes('非常に') || 
        message.includes('現実的な') ||
        message.includes('リスクが高く')) {
      return 'warning'
    }
    
    return 'info'
  }

  /**
   * フィールド名の日本語表示名取得
   */
  getFieldDisplayName(field: keyof InvestmentParams): string {
    const displayNames = {
      annualAmount: '年次積立額',
      annualRate: '想定年利',
      years: '積立期間'
    }
    
    return displayNames[field]
  }
}