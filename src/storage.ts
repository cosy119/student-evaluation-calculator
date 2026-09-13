import { isValidAppData } from './calculations'
import type { AppData } from './types'

export const STORAGE_KEY = 'student-evaluation-calculator:v1'

export const saveData = (data: AppData, storage: Storage = localStorage): boolean => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export const loadData = (fallback: AppData, storage: Storage = localStorage): AppData => {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    return isValidAppData(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}
