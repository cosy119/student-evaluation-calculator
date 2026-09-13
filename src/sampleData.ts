import type { AppData, EvaluationModule, ScoreItem } from './types'

let fallbackId = 0

export const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  fallbackId += 1
  return `local-${Date.now()}-${fallbackId}-${Math.random().toString(36).slice(2, 9)}`
}

export const createItem = (name = '', score = '', weight = '1'): ScoreItem => ({
  id: createId(), name, score, weight,
})

export const createModule = (name = '新模块'): EvaluationModule => ({
  id: createId(), name, collapsed: false, items: [],
})

export const createSampleData = (): AppData => ({
  studentName: '',
  studentId: '',
  modules: [
    {
      ...createModule('思想品德'),
      items: [createItem('志愿服务', '10', '1'), createItem('班级贡献', '8', '1')],
    },
    {
      ...createModule('学业表现'),
      items: [createItem('课程成绩', '85', '1')],
    },
    {
      ...createModule('文体实践'),
      items: [createItem('校园活动', '12', '1')],
    },
  ],
})

export const createEmptyData = (): AppData => ({
  studentName: '',
  studentId: '',
  modules: [],
})
