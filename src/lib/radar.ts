import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join } from 'path'

// 雷达报告目录
const RADAR_DIR = process.env.RADAR_DIR || '/app/data/所有对话/主对话/足球分析/odds_radar'

export interface AbnormalMatch {
  match_no: string
  league: string
  home_team: string
  away_team: string
  level: 'high' | 'medium' | 'normal'
  deviation_pct: number
  direction_hint: string
  key_odds: string
  change_trend: string
}

export interface RadarReport {
  id: string
  filename: string
  exec_time: string
  exec_date: string
  exec_time_str: string
  total_matches: number
  abnormal_high: number
  abnormal_medium: number
  abnormal_normal: number
  summary: string
  matches: AbnormalMatch[]
  raw_content: string
}

// 生成示例数据（文件不存在时使用）
function generateMockReports(): RadarReport[] {
  const today = new Date()
  const reports: RadarReport[] = []

  const times = [
    { h: 22, m: 30, label: '夜场监控' },
    { h: 18, m: 0, label: '傍晚监控' },
    { h: 14, m: 0, label: '午后监控' },
    { h: 10, m: 0, label: '早盘监控' },
  ]

  const leagues = ['英超', '西甲', '德甲', '意甲', '法甲', '欧冠', '欧联', '中超', '日职', '韩K']
  const teamsH = ['曼城', '利物浦', '阿森纳', '皇马', '巴萨', '拜仁', '多特', '尤文', '国米', '巴黎', '曼联', '切尔西', '热刺', '马竞', '塞维利亚']
  const teamsA = ['阿斯顿维拉', '布莱顿', '纽卡斯尔', '毕尔巴鄂', '皇家社会', '勒沃库森', '莱比锡', '那不勒斯', '拉齐奥', '马赛', '西汉姆', '水晶宫', '狼队', '瓦伦西亚', '门兴']
  const directions = ['主胜加深', '客胜拉升', '平局升温', '主胜降温', '客胜回落', '胜负摇摆']
  const odds_keys = ['主胜赔率', '客胜赔率', '平局赔率', '让球主胜', '让球客胜', '大小球']
  const trends = ['↓ 持续下降', '↑ 持续上升', '↑↓ 剧烈震荡', '↓↑ 先降后升', '↑→ 升后走平', '↓→ 降后走平']

  for (let t = 0; t < times.length; t++) {
    const { h, m, label } = times[t]
    const execDate = new Date(today)
    execDate.setHours(h, m, 0, 0)
    const dateStr = execDate.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = execDate.toTimeString().slice(0, 5).replace(':', '')
    const filename = `radar_${dateStr}_${timeStr}.md`

    const total = 40 + Math.floor(Math.random() * 30)
    const highCount = t === 0 ? 5 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 4)
    const mediumCount = t === 0 ? 8 + Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 6)
    const normalCount = total - highCount - mediumCount

    const matches: AbnormalMatch[] = []
    for (let i = 0; i < highCount + mediumCount; i++) {
      const level: 'high' | 'medium' = i < highCount ? 'high' : 'medium'
      const deviation = level === 'high'
        ? 15 + Math.random() * 20
        : 7 + Math.random() * 8
      const league = leagues[Math.floor(Math.random() * leagues.length)]
      const ht = teamsH[Math.floor(Math.random() * teamsH.length)]
      let at = teamsA[Math.floor(Math.random() * teamsA.length)]
      while (at === ht) at = teamsA[Math.floor(Math.random() * teamsA.length)]

      const matchNo = String(i + 1).padStart(3, '0')

      matches.push({
        match_no: matchNo,
        league,
        home_team: ht,
        away_team: at,
        level,
        deviation_pct: Math.round(deviation * 10) / 10,
        direction_hint: directions[Math.floor(Math.random() * directions.length)],
        key_odds: odds_keys[Math.floor(Math.random() * odds_keys.length)],
        change_trend: trends[Math.floor(Math.random() * trends.length)],
      })
    }

    reports.push({
      id: `radar_${dateStr}_${timeStr}`,
      filename,
      exec_time: execDate.toISOString(),
      exec_date: execDate.toISOString().slice(0, 10),
      exec_time_str: `${h}:${String(m).padStart(2, '0')} ${label}`,
      total_matches: total,
      abnormal_high: highCount,
      abnormal_medium: mediumCount,
      abnormal_normal: normalCount,
      summary: `${label}：监控${total}场比赛，发现高度异动${highCount}场，中度异动${mediumCount}场，建议重点关注高度异动场次的资金流向变化。`,
      matches,
      raw_content: `# 赔率雷达监控报告 (${label})\n\n- 执行时间：${execDate.toISOString().slice(0, 10)} ${h}:${String(m).padStart(2, '0')}\n- 监控场次：${total}\n- 高度异动：${highCount}\n- 中度异动：${mediumCount}\n\n## 异动详情\n\n详见上方列表。`,
    })
  }

  return reports
}

// 解析 Markdown 文件（简单解析，提取关键信息）
function parseRadarMarkdown(filename: string, content: string): RadarReport {
  // 从文件名提取日期时间
  const match = filename.match(/radar_(\d{8})_(\d{4})\.md/)
  let execDate = '2026-01-01'
  let execTime = '00:00'
  if (match) {
    const [, dateStr, timeStr] = match
    execDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    execTime = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`
  }

  // 从内容中提取关键信息
  const lines = content.split('\n')
  let totalMatches = 0
  let abnormalHigh = 0
  let abnormalMedium = 0
  let summary = ''
  const matches: AbnormalMatch[] = []

  let inMatchTable = false

  for (const line of lines) {
    // 提取总场次
    const totalMatch = line.match(/监控场次[：:]\s*(\d+)/)
    if (totalMatch) totalMatches = parseInt(totalMatch[1])

    // 提取高度异动
    const highMatch = line.match(/高度异动[：:]\s*(\d+)/)
    if (highMatch) abnormalHigh = parseInt(highMatch[1])

    // 提取中度异动
    const mediumMatch = line.match(/中度异动[：:]\s*(\d+)/)
    if (mediumMatch) abnormalMedium = parseInt(mediumMatch[1])

    // 检测比赛表格
    if (line.includes('场次') && line.includes('联赛') && line.includes('对阵')) {
      inMatchTable = true
      continue
    }
    if (inMatchTable && line.startsWith('|') && line.includes('---')) {
      continue
    }
    if (inMatchTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0)
      if (cells.length >= 5 && !cells[0].includes('场次')) {
        const levelStr = cells.find(c => c.includes('高度') || c.includes('中度') || c.includes('正常')) || 'normal'
        const level: 'high' | 'medium' | 'normal' =
          levelStr.includes('高度') ? 'high' : levelStr.includes('中度') ? 'medium' : 'normal'
        const devMatch = line.match(/(\d+\.?\d*)%/)
        matches.push({
          match_no: cells[0] || '',
          league: cells[1] || '',
          home_team: cells[2]?.split(/vs|VS|—|--/)[0]?.trim() || '',
          away_team: cells[2]?.split(/vs|VS|—|--/)[1]?.trim() || '',
          level,
          deviation_pct: devMatch ? parseFloat(devMatch[1]) : 0,
          direction_hint: cells[4] || '',
          key_odds: cells[3] || '',
          change_trend: cells[5] || '',
        })
      }
    }
    if (inMatchTable && line.trim() === '' && matches.length > 0) {
      inMatchTable = false
    }

    // 摘要
    if (line.startsWith('## 总结') || line.startsWith('## 核心提示')) {
      summary = line.replace(/^##\s+/, '').trim()
    }
  }

  if (!summary) {
    summary = `监控${totalMatches}场比赛，发现高度异动${abnormalHigh}场，中度异动${abnormalMedium}场。`
  }

  const normalCount = totalMatches - abnormalHigh - abnormalMedium

  // 时段标签
  const hour = parseInt(execTime.slice(0, 2))
  let timeLabel = ''
  if (hour < 12) timeLabel = '早盘监控'
  else if (hour < 16) timeLabel = '午后监控'
  else if (hour < 20) timeLabel = '傍晚监控'
  else timeLabel = '夜场监控'

  return {
    id: filename.replace('.md', ''),
    filename,
    exec_time: `${execDate}T${execTime}:00`,
    exec_date: execDate,
    exec_time_str: `${execTime} ${timeLabel}`,
    total_matches: totalMatches,
    abnormal_high: abnormalHigh,
    abnormal_medium: abnormalMedium,
    abnormal_normal: normalCount > 0 ? normalCount : 0,
    summary,
    matches,
    raw_content: content,
  }
}

// 从目录加载所有报告
export function loadRadarReports(date?: string): RadarReport[] {
  try {
    if (!existsSync(RADAR_DIR)) {
      console.log(`[RADAR] 雷达目录不存在: ${RADAR_DIR}，使用示例数据`)
      return generateMockReports()
    }

    const files = readdirSync(RADAR_DIR)
      .filter(f => f.endsWith('.md') && f.startsWith('radar_'))
      .sort((a, b) => b.localeCompare(a))

    let reports: RadarReport[] = files.map(f => {
      const fullPath = join(RADAR_DIR, f)
      const content = readFileSync(fullPath, 'utf-8')
      return parseRadarMarkdown(f, content)
    })

    // 按日期筛选
    if (date) {
      reports = reports.filter(r => r.exec_date === date)
    }

    if (reports.length === 0) {
      console.log('[RADAR] 未找到雷达报告文件，使用示例数据')
      return generateMockReports()
    }

    return reports
  } catch (err) {
    console.error('[RADAR] 加载雷达报告失败:', err)
    return generateMockReports()
  }
}

// 获取可用日期列表
export function getRadarDates(): string[] {
  try {
    if (!existsSync(RADAR_DIR)) {
      return [new Date().toISOString().slice(0, 10)]
    }

    const files = readdirSync(RADAR_DIR)
      .filter(f => f.endsWith('.md') && f.startsWith('radar_'))

    const dates = new Set<string>()
    for (const f of files) {
      const m = f.match(/radar_(\d{8})/)
      if (m) {
        const d = `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`
        dates.add(d)
      }
    }

    return Array.from(dates).sort((a, b) => b.localeCompare(a))
  } catch {
    return [new Date().toISOString().slice(0, 10)]
  }
}
