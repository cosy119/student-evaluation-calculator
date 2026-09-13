import { describe, expect, it } from 'vitest'
import { createSampleData } from './sampleData'
import { loadData, saveData, STORAGE_KEY } from './storage'

describe('本地存储', () => {
  it('保存并恢复有效数据', () => {
    const data = createSampleData()
    expect(saveData(data)).toBe(true)
    expect(loadData({ studentName: '', studentId: '', modules: [] })).toEqual(data)
  })

  it('损坏数据回退到默认值', () => {
    const fallback = createSampleData()
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(loadData(fallback)).toBe(fallback)
  })
})
