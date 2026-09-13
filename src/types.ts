export interface ScoreItem {
  id: string
  name: string
  score: string
  weight: string
}

export interface EvaluationModule {
  id: string
  name: string
  collapsed: boolean
  items: ScoreItem[]
}

export interface AppData {
  studentName: string
  studentId: string
  modules: EvaluationModule[]
}

export interface ModuleResult {
  rawScore: number
}
