import { describe, expect, it } from 'vitest'
import { calculateModule, calculateRatioTotal, calculateTotal, formatSignificant, itemWeightedScore, isValidAppData, roundToSignificant, toNumber } from './calculations'
import type { EvaluationModule, ScoreItem } from './types'

const item = (score: string, weight: string): ScoreItem => ({ id: crypto.randomUUID(), name: '测试项', score, weight })
const module = (ratio: string, items: ScoreItem[]): EvaluationModule => ({ id: crypto.randomUUID(), name: '测试模块', ratio, collapsed: false, items })

describe('综测计算', () => {
  it('将空输入和非法数字按 0 处理', () => {
    expect(toNumber('')).toBe(0)
    expect(toNumber('abc')).toBe(0)
    expect(toNumber('0x10')).toBe(0)
    expect(toNumber('1e3')).toBe(0)
  })

  it('计算条目分数与权重的乘积', () => {
    expect(itemWeightedScore(item('5', '2'))).toBe(10)
    expect(itemWeightedScore(item('-3.5', '2'))).toBe(-7)
  })

  it('负权重和负模块比例在计算时按 0 处理', () => {
    expect(itemWeightedScore(item('8', '-2'))).toBe(0)
    expect(calculateModule(module('-30', [item('10', '1')])).contribution).toBe(0)
  })

  it('计算模块原始分与贡献分', () => {
    expect(calculateModule(module('40', [item('10', '1'), item('5', '2')]))).toEqual({ rawScore: 20, contribution: 8 })
  })

  it('空模块按 0 分计算', () => {
    expect(calculateModule(module('30', []))).toEqual({ rawScore: 0, contribution: 0 })
  })

  it('模块比例无需等于 100 也可汇总', () => {
    const modules = [module('20', [item('50', '1')]), module('30', [item('100', '1')])]
    expect(calculateRatioTotal(modules)).toBe(50)
    expect(calculateTotal(modules)).toBe(40)
  })

  it('数值按 6 位有效数字舍入和显示', () => {
    expect(roundToSignificant(12.3456789)).toBe(12.3457)
    expect(roundToSignificant(0.00123456789)).toBe(0.00123457)
    expect(formatSignificant(12.3)).toBe('12.3000')
    expect(formatSignificant(0)).toBe('0.00000')
    expect(formatSignificant(1234567)).toBe('1234570')
  })

  it('拒绝结构损坏的本地数据', () => {
    expect(isValidAppData({ studentName: '张三', studentId: '1', modules: 'bad' })).toBe(false)
  })
})
