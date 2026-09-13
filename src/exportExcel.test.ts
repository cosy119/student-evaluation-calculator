import { describe, expect, it } from 'vitest'
import { formatLocalDate, sanitizeFileNamePart } from './exportExcel'

describe('Excel 导出辅助逻辑', () => {
  it('使用本地日期组成文件名日期', () => {
    const date = new Date(2026, 8, 13, 0, 30)
    expect(formatLocalDate(date)).toBe('2026-09-13')
  })

  it('清除文件名中的控制字符、非法字符和尾部点号', () => {
    expect(sanitizeFileNamePart('  张\n三:*?.  ')).toBe('张_三___')
    expect(sanitizeFileNamePart('   ...')).toBe('未命名')
  })

  it('限制文件名中的姓名长度', () => {
    expect(sanitizeFileNamePart('甲'.repeat(100))).toHaveLength(60)
    expect(sanitizeFileNamePart(`${'A'.repeat(59)}.${'B'.repeat(10)}`).endsWith('.')).toBe(false)
  })
})
