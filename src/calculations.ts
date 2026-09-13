import type { AppData, EvaluationModule, ModuleResult, ScoreItem } from './types'

export const toNumber = (value: string): number => {
  const normalized = value.trim()
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export const toNonNegative = (value: string): number => Math.max(0, toNumber(value))

export const roundToDecimals = (value: number, digits = 6): number => {
  if (!Number.isFinite(value) || value === 0) return 0
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export const formatDecimals = (value: number, digits = 6): string =>
  Number.isFinite(value) ? roundToDecimals(value, digits).toFixed(digits) : (0).toFixed(digits)

export const itemWeightedScore = (item: ScoreItem): number =>
  toNumber(item.score) * toNonNegative(item.weight)

export const calculateModule = (module: EvaluationModule): ModuleResult => {
  const rawScore = module.items.reduce((sum, item) => sum + itemWeightedScore(item), 0)
  return {
    rawScore,
  }
}

export const calculateTotal = (modules: EvaluationModule[]): number =>
  modules.reduce((sum, module) => sum + calculateModule(module).rawScore, 0)

export const isValidAppData = (value: unknown): value is AppData => {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<AppData>
  return typeof data.studentName === 'string'
    && typeof data.studentId === 'string'
    && Array.isArray(data.modules)
    && data.modules.every((module) =>
      module
      && typeof module.id === 'string'
      && typeof module.name === 'string'
      && typeof module.collapsed === 'boolean'
      && Array.isArray(module.items)
      && module.items.every((item) =>
        item
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.score === 'string'
        && typeof item.weight === 'string'))
}
