import type {
  InvestmentParams,
  InvestmentResult,
  YearlyContribution,
  GrowthStageData
} from '@/types/investment'

/**
 * 積立投資計算エンジン
 * 複利計算と年次別寄与度計算を行う
 */
export class InvestmentCalculator {
  /**
   * メイン計算処理
   * @param params 投資パラメータ
   * @returns 投資結果
   */
  calculate(params: InvestmentParams): InvestmentResult {
    const yearlyContributions = this.calculateYearlyContributions(params)
    
    const totalValue = yearlyContributions.reduce((sum, year) => sum + year.currentValue, 0)
    const totalContributed = params.monthlyAmount * 12 * params.years
    const totalProfit = totalValue - totalContributed
    const profitRate = totalContributed > 0 ? totalProfit / totalContributed : 0

    return {
      totalValue,
      totalContributed,
      totalProfit,
      profitRate,
      yearlyContributions
    }
  }

  /**
   * 年次別寄与度計算
   * 各年に積み立てた資金が最終的にどの程度の価値を持つかを計算
   */
  private calculateYearlyContributions(params: InvestmentParams): YearlyContribution[] {
    const { monthlyAmount, annualRate, years } = params
    const contributions: YearlyContribution[] = []

    for (let year = 1; year <= years; year++) {
      const annualAmount = monthlyAmount * 12
      const remainingYears = years - year
      
      // その年の積立が最終時点で持つ価値（複利計算）
      const currentValue = this.calculateFutureValue(
        annualAmount,
        annualRate,
        remainingYears
      )

      contributions.push({
        year,
        monthlyAmount,
        annualAmount,
        totalContributed: annualAmount * year,
        currentValue,
        contribution: currentValue  // 寄与度は現在価値と同値
      })
    }

    return contributions
  }

  /**
   * 将来価値計算（複利）
   * FV = PV × (1 + r)^n
   * @param presentValue 現在価値
   * @param rate 年利率
   * @param periods 期間（年）
   * @returns 将来価値
   */
  private calculateFutureValue(
    presentValue: number,
    rate: number,
    periods: number
  ): number {
    // NaN/undefined/無効値の場合はデフォルト値を使用
    if (isNaN(rate) || rate === null || rate === undefined) {
      rate = 0.01 // 1%をデフォルトに
    }
    
    // 期間が0の場合は元本のまま
    if (periods === 0) {
      return presentValue
    }

    return presentValue * Math.pow(1 + rate, periods)
  }

  /**
   * スタックエリアチャート用データ生成
   * 各年の積立が経年でどのように成長するかを表現
   */
  generateGrowthStageData(params: InvestmentParams): GrowthStageData[] {
    const { monthlyAmount, annualRate, years } = params
    const growthData: GrowthStageData[] = []

    // 各経過年（1年目〜30年目）について
    for (let currentYear = 1; currentYear <= years; currentYear++) {
      const stages: GrowthStageData['stages'] = []
      let accumulated = 0

      // その時点までに積み立てた各年の価値を計算
      for (let contributedYear = 1; contributedYear <= currentYear; contributedYear++) {
        const annualAmount = monthlyAmount * 12
        const yearsGrown = currentYear - contributedYear
        
        const value = this.calculateFutureValue(annualAmount, annualRate, yearsGrown)
        accumulated += value

        stages.push({
          yearContributed: contributedYear,
          value,
          accumulated
        })
      }

      growthData.push({
        year: currentYear,
        stages
      })
    }

    return growthData
  }

  /**
   * 月次複利計算（より正確な計算）
   * 実際の積立投資では月次で複利が発生するため
   */
  calculateWithMonthlyCompounding(params: InvestmentParams): InvestmentResult {
    const { monthlyAmount, annualRate, years } = params
    const monthlyRate = annualRate / 12
    const totalMonths = years * 12
    
    let totalValue = 0
    const yearlyContributions: YearlyContribution[] = []

    // 年次別に処理
    for (let year = 1; year <= years; year++) {
      const yearStartMonth = (year - 1) * 12
      const yearEndMonth = year * 12
      let yearValue = 0

      // その年の各月の積立を計算
      for (let month = yearStartMonth; month < yearEndMonth; month++) {
        const remainingMonths = totalMonths - month
        const futureValue = this.calculateMonthlyFutureValue(
          monthlyAmount,
          monthlyRate,
          remainingMonths
        )
        yearValue += futureValue
      }

      yearlyContributions.push({
        year,
        monthlyAmount,
        annualAmount: monthlyAmount * 12,
        totalContributed: monthlyAmount * 12 * year,
        currentValue: yearValue,
        contribution: yearValue
      })

      totalValue += yearValue
    }

    const totalContributed = monthlyAmount * totalMonths
    const totalProfit = totalValue - totalContributed
    const profitRate = totalContributed > 0 ? totalProfit / totalContributed : 0

    return {
      totalValue,
      totalContributed,
      totalProfit,
      profitRate,
      yearlyContributions
    }
  }

  /**
   * 月次複利の将来価値計算
   */
  private calculateMonthlyFutureValue(
    monthlyPayment: number,
    monthlyRate: number,
    months: number
  ): number {
    if (monthlyRate === 0) {
      return monthlyPayment
    }

    return monthlyPayment * Math.pow(1 + monthlyRate, months)
  }

  /**
   * パフォーマンス統計計算
   * 年平均収益率、標準偏差等の計算（将来的な機能拡張用）
   */
  calculatePerformanceStats(yearlyContributions: YearlyContribution[]): {
    averageAnnualReturn: number
    totalReturnRate: number
    compoundAnnualGrowthRate: number
  } {
    if (yearlyContributions.length === 0) {
      return {
        averageAnnualReturn: 0,
        totalReturnRate: 0,
        compoundAnnualGrowthRate: 0
      }
    }

    const totalContributed = yearlyContributions.reduce((sum, year) => sum + year.annualAmount, 0)
    const totalValue = yearlyContributions.reduce((sum, year) => sum + year.currentValue, 0)
    const years = yearlyContributions.length

    const totalReturnRate = totalContributed > 0 ? (totalValue - totalContributed) / totalContributed : 0
    const compoundAnnualGrowthRate = years > 0 ? Math.pow(totalValue / totalContributed, 1 / years) - 1 : 0
    const averageAnnualReturn = totalReturnRate / years

    return {
      averageAnnualReturn,
      totalReturnRate,
      compoundAnnualGrowthRate
    }
  }
}