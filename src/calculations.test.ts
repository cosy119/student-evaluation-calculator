import { describe, expect, it } from 'vitest'
import { calculateModule, calculateTotal, formatDecimals, itemWeightedScore, isValidAppData, roundToDecimals, toNumber } from './calculations'
import type { EvaluationModule, ScoreItem } from './types'

const item = (score: string, weight: string): ScoreItem => ({ id: crypto.randomUUID(), name: '测试项', score, weight })
const module = (items: ScoreItem[]): EvaluationModule => ({ id: crypto.randomUUID(), name: '测试模块', collapsed: false, items })

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

  it('负权重在计算时按 0 处理', () => {
    expect(itemWeightedScore(item('8', '-2'))).toBe(0)
  })

  it('按条目权重计算模块得分', () => {
    expect(calculateModule(module([item('10', '1'), item('5', '2')]))).toEqual({ rawScore: 20 })
  })

  it('空模块按 0 分计算', () => {
    expect(calculateModule(module([]))).toEqual({ rawScore: 0 })
  })

  it('直接汇总各模块得分', () => {
    const modules = [module([item('50', '1')]), module([item('100', '1')])]
    expect(calculateTotal(modules)).toBe(150)
  })

  it('数值固定保留 6 位小数', () => {
    expect(roundToDecimals(12.3456789)).toBe(12.345679)
    expect(roundToDecimals(0.00123456789)).toBe(0.001235)
    expect(formatDecimals(12.3)).toBe('12.300000')
    expect(formatDecimals(0)).toBe('0.000000')
    expect(formatDecimals(1234567)).toBe('1234567.000000')
  })

  it('拒绝结构损坏的本地数据', () => {
    expect(isValidAppData({ studentName: '张三', studentId: '1', modules: 'bad' })).toBe(false)
  })
})
