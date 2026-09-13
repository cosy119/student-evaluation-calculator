import * as XLSX from 'xlsx-js-style'
import { calculateModule, calculateTotal, itemWeightedScore, roundToDecimals, toNonNegative, toNumber } from './calculations'
import type { AppData } from './types'

const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '087F6B' } },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const totalStyle = {
  font: { bold: true, color: { rgb: '064E3B' } },
  fill: { fgColor: { rgb: 'DDF5EC' } },
}

const styleSheet = (sheet: XLSX.WorkSheet, widths: number[], totalRow?: number) => {
  sheet['!cols'] = widths.map((wch) => ({ wch }))
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1')
  for (let row = 1; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })]
      if (cell?.t === 'n') cell.z = '0.000000'
    }
  }
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const header = sheet[XLSX.utils.encode_cell({ r: 0, c: column })]
    if (header) header.s = headerStyle
    if (totalRow !== undefined) {
      const cell = sheet[XLSX.utils.encode_cell({ r: totalRow, c: column })]
      if (cell) cell.s = totalStyle
    }
  }
}

export const formatLocalDate = (date: Date): string => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-')

export const sanitizeFileNamePart = (value: string): string => {
  const cleaned = value
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_')
    .trim()
    .slice(0, 60)
    .replace(/[. ]+$/g, '')
  return cleaned || '未命名'
}

export const exportToExcel = (data: AppData) => {
  const detailRows: (string | number)[][] = [[
    '学生姓名', '学号', '模块', '条目名称', '分数', '权重倍数', '条目加权分', '模块得分',
  ]]

  const subtotalRows: number[] = []
  data.modules.forEach((module) => {
    const result = calculateModule(module)
    module.items.forEach((item) => {
      detailRows.push([
        data.studentName || '未填写', data.studentId || '未填写', module.name || '未命名模块',
        item.name || '未命名条目', roundToDecimals(toNumber(item.score)),
        roundToDecimals(toNonNegative(item.weight)), roundToDecimals(itemWeightedScore(item)), '',
      ])
    })
    detailRows.push([
      data.studentName || '未填写', data.studentId || '未填写', module.name || '未命名模块',
      module.items.length === 0 ? '模块小计（无条目）' : '模块小计',
      '', '', '', roundToDecimals(result.rawScore),
    ])
    subtotalRows.push(detailRows.length - 1)
  })

  const summaryRows: (string | number)[][] = [['模块', '条目数量', '模块得分']]
  data.modules.forEach((module) => {
    const result = calculateModule(module)
    summaryRows.push([
      module.name || '未命名模块',
      module.items.length,
      roundToDecimals(result.rawScore),
    ])
  })
  summaryRows.push([
    '最终总分', '',
    roundToDecimals(calculateTotal(data.modules)),
  ])

  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows)
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  styleSheet(detailSheet, [14, 18, 18, 22, 12, 14, 16, 16])
  styleSheet(summarySheet, [22, 14, 18], summaryRows.length - 1)
  subtotalRows.forEach((row) => {
    for (let column = 0; column < 8; column += 1) {
      const cell = detailSheet[XLSX.utils.encode_cell({ r: row, c: column })]
      if (cell) cell.s = totalStyle
    }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, detailSheet, '综测明细')
  XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总')
  const date = formatLocalDate(new Date())
  const safeName = sanitizeFileNamePart(data.studentName)
  XLSX.writeFile(workbook, `综测计算_${safeName}_${date}.xlsx`)
}
