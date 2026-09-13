import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown, ArrowUp, CaretDown, CaretUp, ChartDonut, Check, DownloadSimple,
  FloppyDisk, Plus, Student, Trash, X,
} from '@phosphor-icons/react'
import { calculateModule, calculateTotal, formatSignificant, itemWeightedScore, toNumber } from './calculations'
import { createEmptyData, createItem, createModule, createSampleData } from './sampleData'
import { loadData, saveData } from './storage'
import type { AppData, EvaluationModule, ScoreItem } from './types'

type NoticeState = { message: string; undoData?: AppData } | null

const format = (value: number) => formatSignificant(value)
const isNegative = (value: string) => value !== '' && toNumber(value) < 0

function App() {
  const [data, setData] = useState<AppData>(() => loadData(createEmptyData()))
  const [notice, setNotice] = useState<NoticeState>(null)
  const [saved, setSaved] = useState(true)
  const [exporting, setExporting] = useState(false)
  const noticeTimer = useRef<number | undefined>(undefined)
  const total = useMemo(() => calculateTotal(data.modules), [data.modules])

  useEffect(() => {
    setSaved(false)
    const timer = window.setTimeout(() => setSaved(saveData(data)), 250)
    return () => window.clearTimeout(timer)
  }, [data])

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  const updateData = (recipe: (previous: AppData) => AppData) => setData(recipe)

  const rememberUndo = (message: string, previous: AppData) => {
    window.clearTimeout(noticeTimer.current)
    setNotice({ message, undoData: previous })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000)
  }

  const showNotice = (message: string) => {
    window.clearTimeout(noticeTimer.current)
    setNotice((previous) => previous?.undoData
      ? { message: `${message}，${previous.message}`, undoData: previous.undoData }
      : { message })
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000)
  }

  const updateModule = (moduleId: string, changes: Partial<EvaluationModule>) => {
    updateData((previous) => ({
      ...previous,
      modules: previous.modules.map((module) => module.id === moduleId ? { ...module, ...changes } : module),
    }))
  }

  const updateItem = (moduleId: string, itemId: string, changes: Partial<ScoreItem>) => {
    updateData((previous) => ({
      ...previous,
      modules: previous.modules.map((module) => module.id === moduleId
        ? { ...module, items: module.items.map((item) => item.id === itemId ? { ...item, ...changes } : item) }
        : module),
    }))
  }

  const deleteModule = (moduleId: string) => {
    const snapshot = data
    updateData((previous) => ({ ...previous, modules: previous.modules.filter((module) => module.id !== moduleId) }))
    rememberUndo('模块已删除', snapshot)
  }

  const deleteItem = (moduleId: string, itemId: string) => {
    const snapshot = data
    updateData((previous) => ({
      ...previous,
      modules: previous.modules.map((module) => module.id === moduleId
        ? { ...module, items: module.items.filter((item) => item.id !== itemId) }
        : module),
    }))
    rememberUndo('条目已删除', snapshot)
  }

  const moveModule = (index: number, direction: -1 | 1) => {
    updateData((previous) => {
      const nextIndex = index + direction
      if (index < 0 || index >= previous.modules.length || nextIndex < 0 || nextIndex >= previous.modules.length) return previous
      const modules = [...previous.modules]
      ;[modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]]
      return { ...previous, modules }
    })
  }

  const resetAll = () => {
    if (!window.confirm('确定要清空当前所有数据吗？清空后可在 6 秒内撤销。')) return
    const previous = data
    setData({ studentName: '', studentId: '', modules: [] })
    rememberUndo('所有数据已清空', previous)
  }

  const restoreUndo = () => {
    if (!notice?.undoData) return
    setData(notice.undoData)
    setNotice(null)
    window.clearTimeout(noticeTimer.current)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { exportToExcel } = await import('./exportExcel')
      exportToExcel(data)
      showNotice('Excel 文件已生成')
    } catch (error) {
      console.error('Excel export failed:', error)
      showNotice('导出失败，请检查浏览器下载权限或磁盘空间后重试。')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"><Student size={25} weight="duotone" /></div>
            <div>
              <h1>大学生综测计算器</h1>
              <p>每一项分数，都算得清楚</p>
            </div>
          </div>
          <div className="top-actions">
            <span className={`save-state ${saved ? 'is-saved' : ''}`}>
              {saved ? <Check size={16} weight="bold" /> : <FloppyDisk size={16} />}
              {saved ? '已自动保存' : '正在保存'}
            </span>
            <button className="button button-secondary" onClick={resetAll}><Trash size={18} />清空</button>
            <button className="button button-primary" onClick={handleExport} disabled={data.modules.length === 0 || exporting}>
              <DownloadSimple size={19} weight="bold" />{exporting ? '正在生成' : '导出 Excel'}
            </button>
          </div>
        </div>
      </header>

      <main className="page-wrap">
        <section className="intro-row" aria-labelledby="page-heading">
          <div>
            <span className="eyebrow">综合素质测评</span>
            <h2 id="page-heading">把复杂的加分项，整理成一份明白账。</h2>
            <p>自由组合模块与条目，修改后立即计算。你的数据只保存在当前浏览器中。</p>
          </div>
          <div className="student-fields" aria-label="学生信息">
            <label>学生姓名<input value={data.studentName} onChange={(event) => setData({ ...data, studentName: event.target.value })} placeholder="请输入姓名" /></label>
            <label>学号<input value={data.studentId} onChange={(event) => setData({ ...data, studentId: event.target.value })} placeholder="请输入学号" /></label>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="modules-area" aria-label="测评模块">
            <div className="section-heading">
              <div><h3>评分模块</h3><p>共 {data.modules.length} 个模块，可按需要自由调整</p></div>
              <button className="button button-primary" onClick={() => setData({ ...data, modules: [...data.modules, createModule()] })}>
                <Plus size={18} weight="bold" />添加模块
              </button>
            </div>

            {data.modules.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ChartDonut size={34} weight="duotone" /></div>
                <h3>还没有评分模块</h3>
                <p>添加第一个模块，开始记录你的综测项目。</p>
                <div className="empty-actions">
                  <button className="button button-primary" onClick={() => setData({ ...data, modules: [createModule()] })}><Plus size={18} />添加模块</button>
                  <button className="button button-secondary" onClick={() => setData((previous) => ({
                    ...createSampleData(),
                    studentName: previous.studentName,
                    studentId: previous.studentId,
                  }))}>载入示例</button>
                </div>
              </div>
            ) : data.modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                moduleCount={data.modules.length}
                onUpdate={(changes) => updateModule(module.id, changes)}
                onUpdateItem={(itemId, changes) => updateItem(module.id, itemId, changes)}
                onAddItem={() => updateModule(module.id, { items: [...module.items, createItem()] })}
                onDeleteItem={(itemId) => deleteItem(module.id, itemId)}
                onDelete={() => deleteModule(module.id)}
                onMove={(direction) => moveModule(index, direction)}
              />
            ))}
          </section>

          <aside className="summary-card" aria-label="结果汇总">
            <div className="summary-title"><ChartDonut size={22} weight="duotone" /><h3>结果汇总</h3></div>
            <div className="total-score"><span>最终综测总分</span><strong>{format(total)}</strong></div>
            <div className="summary-list">
              {data.modules.length === 0 ? <p className="summary-empty">添加模块后，这里会显示得分构成。</p> : data.modules.map((module, index) => {
                const result = calculateModule(module)
                return <div className="summary-row" key={module.id}>
                  <span className={`module-dot tone-${index % 4}`} aria-hidden="true" />
                  <div><strong>{module.name || '未命名模块'}</strong><small>{module.items.length} 个评分条目</small></div>
                  <b>{format(result.rawScore)}</b>
                </div>
              })}
            </div>
            <div className="formula-note">
              <strong>计算方式</strong>
              <p>条目分数 × 条目权重得到模块分，再汇总所有模块。结果统一显示 6 位有效数字。</p>
            </div>
          </aside>
        </div>
      </main>

      {notice && <div className="toast" role="status"><span>{notice.message}</span>{notice.undoData && <button onClick={restoreUndo}>撤销</button>}<button className="toast-close" aria-label="关闭提示" onClick={() => setNotice(null)}><X size={17} /></button></div>}
    </div>
  )
}

interface ModuleCardProps {
  module: EvaluationModule
  index: number
  moduleCount: number
  onUpdate: (changes: Partial<EvaluationModule>) => void
  onUpdateItem: (itemId: string, changes: Partial<ScoreItem>) => void
  onAddItem: () => void
  onDeleteItem: (itemId: string) => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
}

function ModuleCard({ module, index, moduleCount, onUpdate, onUpdateItem, onAddItem, onDeleteItem, onDelete, onMove }: ModuleCardProps) {
  const result = calculateModule(module)
  return <article className={`module-card tone-border-${index % 4}`}>
    <div className="module-header">
      <span className={`module-index tone-bg-${index % 4}`}>{String(index + 1).padStart(2, '0')}</span>
      <div className="module-name-field"><label htmlFor={`module-name-${module.id}`}>模块名称</label><input id={`module-name-${module.id}`} value={module.name} onChange={(event) => onUpdate({ name: event.target.value })} placeholder="例如：思想品德" /></div>
      <div className="module-actions">
        <button className="icon-button" aria-label="上移模块" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={18} /></button>
        <button className="icon-button" aria-label="下移模块" disabled={index === moduleCount - 1} onClick={() => onMove(1)}><ArrowDown size={18} /></button>
        <button className="icon-button danger" aria-label="删除模块" onClick={() => window.confirm(`确定删除“${module.name || '未命名模块'}”吗？`) && onDelete()}><Trash size={18} /></button>
        <button className="icon-button" aria-label={module.collapsed ? '展开模块' : '折叠模块'} aria-expanded={!module.collapsed} onClick={() => onUpdate({ collapsed: !module.collapsed })}>{module.collapsed ? <CaretDown size={18} /> : <CaretUp size={18} />}</button>
      </div>
    </div>

    {!module.collapsed && <>
      <div className="item-table-head" aria-hidden="true"><span>条目名称</span><span>分数</span><span>权重</span><span>加权分</span><span /></div>
      <div className="items-list">
        {module.items.length === 0 ? <div className="module-empty"><p>这个模块还没有条目，当前按 0 分计算。</p><button onClick={onAddItem}><Plus size={17} />添加第一条</button></div> : module.items.map((item, itemIndex) => (
          <div className="item-row" key={item.id}>
            <label><span className="mobile-label">条目名称</span><input value={item.name} onChange={(event) => onUpdateItem(item.id, { name: event.target.value })} placeholder={`条目 ${itemIndex + 1}`} /></label>
            <label><span className="mobile-label">分数</span><input aria-label={`${item.name || `条目${itemIndex + 1}`}分数`} type="number" step="0.01" value={item.score} onChange={(event) => onUpdateItem(item.id, { score: event.target.value })} placeholder="0" /></label>
            <label><span className="mobile-label">权重</span><div className="input-with-unit"><input aria-label={`${item.name || `条目${itemIndex + 1}`}权重`} type="number" min="0" step="0.01" value={item.weight} onChange={(event) => onUpdateItem(item.id, { weight: event.target.value })} /><span>倍</span></div>{isNegative(item.weight) && <small className="field-error">权重不能为负数</small>}</label>
            <div className="weighted-score"><span className="mobile-label">加权分</span><strong>{format(itemWeightedScore(item))}</strong></div>
            <button className="icon-button danger" aria-label={`删除${item.name || `条目${itemIndex + 1}`}`} onClick={() => window.confirm('确定删除这条数据吗？') && onDeleteItem(item.id)}><Trash size={17} /></button>
          </div>
        ))}
      </div>
      <div className="module-footer">
        <button className="add-item-button" onClick={onAddItem}><Plus size={17} weight="bold" />添加条目</button>
        <div className="module-totals"><span>模块得分 <strong>{format(result.rawScore)}</strong></span></div>
      </div>
    </>}
    {module.collapsed && <div className="collapsed-summary"><span>{module.items.length} 个条目</span><span>模块得分 <strong>{format(result.rawScore)}</strong></span></div>}
  </article>
}

export default App
