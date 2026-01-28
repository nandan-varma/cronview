import cronParserPkg from 'cron-parser'
const { parseExpression } = cronParserPkg as unknown as { parseExpression: typeof import('cron-parser').parseExpression }

const AT_MAP: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

export function normaliseAtSyntax(expr: string): string {
  return AT_MAP[expr.trim().toLowerCase()] ?? expr
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function fmtTime(h: number, m: number): string {
  if (h === 0 && m === 0) return 'midnight'
  if (h === 12 && m === 0) return 'noon'
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12}:00 ${suffix}` : `${hour12}:${pad(m)} ${suffix}`
}

export function toHumanSchedule(expr: string, _tz = 'UTC'): string {
  const normalised = normaliseAtSyntax(expr)
  const parts = normalised.trim().split(/\s+/)
  if (parts.length !== 5) return 'Custom schedule'

  const [min, hour, dom, month, dow] = parts

  // Every minute
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute'
  }

  // Every N minutes
  if (min.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    const n = parseInt(min.slice(2))
    return `Every ${n} minute${n !== 1 ? 's' : ''}`
  }

  // Every hour (at :00)
  if (min === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every hour'
  }

  // Every N hours
  if (min === '0' && hour.startsWith('*/') && dom === '*' && month === '*' && dow === '*') {
    const n = parseInt(hour.slice(2))
    return `Every ${n} hours`
  }

  // Every hour at specific minute
  if (!min.includes('*') && !min.includes('/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `Every hour at :${pad(parseInt(min))}`
  }

  const isFixedMin = !min.includes('*') && !min.includes('/')
  const isFixedHour = !hour.includes('*') && !hour.includes('/')
  const isFixedDow = !dow.includes('*') && !dow.includes('/')
  const isFixedDom = !dom.includes('*') && !dom.includes('/')
  const isAnyMonth = month === '*'

  // Daily at specific time
  if (isFixedMin && isFixedHour && dom === '*' && isAnyMonth && dow === '*') {
    return `Every day at ${fmtTime(parseInt(hour), parseInt(min))}`
  }

  // Weekly on a day
  if (isFixedMin && isFixedHour && dom === '*' && isAnyMonth && isFixedDow) {
    const dayIndex = parseInt(dow)
    const dayName = DAYS[dayIndex] ?? `day ${dow}`
    return `Every ${dayName} at ${fmtTime(parseInt(hour), parseInt(min))}`
  }

  // Monthly on a specific day
  if (isFixedMin && isFixedHour && isFixedDom && isAnyMonth && dow === '*') {
    const d = parseInt(dom)
    const suffix = d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'
    return `On the ${d}${suffix} of each month at ${fmtTime(parseInt(hour), parseInt(min))}`
  }

  return 'Custom schedule'
}

export function getNextRuns(expr: string, count = 5, tz = 'UTC'): Date[] {
  const normalised = normaliseAtSyntax(expr)
  const interval = parseExpression(normalised, { tz })
  const dates: Date[] = []
  for (let i = 0; i < count; i++) {
    dates.push(interval.next().toDate())
  }
  return dates
}

export function validateExpr(expr: string): { valid: boolean; error?: string } {
  try {
    const normalised = normaliseAtSyntax(expr)
    parseExpression(normalised)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}
