import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { StoreShape } from './useTimeTracker.ts'

type TaskDef = {
  id: string
  title: string
  rewardXp: number
  targetValue: number
  unit: string
  getValue: (metrics: DayMetrics) => number
}

type DayMetrics = {
  totalEntries: number
  meaningfulEntries: number
  totalDurationMs: number
}

type TaskState = {
  totalXp: number
  daily: Record<string, { completedTaskIds: string[] }>
}

export type TaskItemView = {
  id: string
  title: string
  rewardXp: number
  progressText: string
  progressPct: number
  completed: boolean
}

const TASK_STATE_KEY = 'time-tracker:tasks:v1'
const TRACKER_KEY = 'time-tracker:v2-by-date'

const TASK_DEFS: TaskDef[] = [
  { id: 'daily_first_record', title: '今日完成首次记录', rewardXp: 10, targetValue: 1, unit: '条', getValue: (m) => m.totalEntries },
  { id: 'daily_add_3', title: '今日新增 3 条记录', rewardXp: 20, targetValue: 3, unit: '条', getValue: (m) => m.totalEntries },
  {
    id: 'daily_meaningful_1',
    title: '今日至少 1 条有意义记录',
    rewardXp: 15,
    targetValue: 1,
    unit: '条',
    getValue: (m) => m.meaningfulEntries,
  },
  {
    id: 'daily_total_60m',
    title: '今日累计记录时长 60 分钟',
    rewardXp: 25,
    targetValue: 60,
    unit: '分钟',
    getValue: (m) => Math.floor(m.totalDurationMs / 60000),
  },
]

function readTaskState(): TaskState {
  try {
    const raw = localStorage.getItem(TASK_STATE_KEY)
    if (!raw) return { totalXp: 0, daily: {} }
    const parsed = JSON.parse(raw) as Partial<TaskState>
    return {
      totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : 0,
      daily: parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {},
    }
  } catch {
    return { totalXp: 0, daily: {} }
  }
}

function writeTaskState(state: TaskState) {
  localStorage.setItem(TASK_STATE_KEY, JSON.stringify(state))
}

function hasAnyEntry(day: unknown) {
  if (!day || typeof day !== 'object') return false
  const obj = day as { meaningless?: unknown[]; meaningful?: unknown[] }
  return (Array.isArray(obj.meaningless) && obj.meaningless.length > 0) || (Array.isArray(obj.meaningful) && obj.meaningful.length > 0)
}

function readRecordedDates() {
  try {
    const raw = localStorage.getItem(TRACKER_KEY)
    if (!raw) return [] as string[]
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(parsed)
      .filter(([_, day]) => hasAnyEntry(day))
      .map(([date]) => date)
      .sort((a, b) => a.localeCompare(b))
  } catch {
    return [] as string[]
  }
}

function toDateText(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function calcCurrentStreak(recordedDates: string[]) {
  const dateSet = new Set(recordedDates)
  let streak = 0
  const cursor = new Date()
  while (true) {
    const key = toDateText(cursor)
    if (!dateSet.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function useTasks(params: {
  selectedDate: Ref<string>
  store: StoreShape
  overallTotalMs: ComputedRef<number>
}) {
  const totalXp = ref(0)
  const lastAwardedTaskIds = ref<string[]>([])

  const todayMetrics = computed<DayMetrics>(() => ({
    totalEntries: params.store.meaningless.length + params.store.meaningful.length,
    meaningfulEntries: params.store.meaningful.length,
    totalDurationMs: params.overallTotalMs.value,
  }))

  const taskItems = computed<TaskItemView[]>(() => {
    const state = readTaskState()
    const doneSet = new Set(state.daily[params.selectedDate.value]?.completedTaskIds ?? [])
    return TASK_DEFS.map((t) => {
      const value = t.getValue(todayMetrics.value)
      const pct = t.targetValue > 0 ? Math.min(100, (value / t.targetValue) * 100) : 0
      return {
        id: t.id,
        title: t.title,
        rewardXp: t.rewardXp,
        progressText: `${Math.min(value, t.targetValue)}/${t.targetValue}${t.unit}`,
        progressPct: pct,
        completed: doneSet.has(t.id),
      }
    })
  })

  const level = computed(() => Math.floor(totalXp.value / 100) + 1)
  const currentLevelXp = computed(() => totalXp.value % 100)
  const streakDays = computed(() => calcCurrentStreak(readRecordedDates()))

  function syncAndAward() {
    const state = readTaskState()
    const day = params.selectedDate.value
    const dayState = state.daily[day] ?? { completedTaskIds: [] }
    const doneSet = new Set(dayState.completedTaskIds)
    const newlyAwarded: string[] = []

    for (const task of TASK_DEFS) {
      const ok = task.getValue(todayMetrics.value) >= task.targetValue
      if (ok && !doneSet.has(task.id)) {
        doneSet.add(task.id)
        state.totalXp += task.rewardXp
        newlyAwarded.push(task.id)
      }
    }

    state.daily[day] = { completedTaskIds: Array.from(doneSet) }
    writeTaskState(state)
    totalXp.value = state.totalXp
    lastAwardedTaskIds.value = newlyAwarded
  }

  watch(
    () => [params.selectedDate.value, todayMetrics.value.totalEntries, todayMetrics.value.meaningfulEntries, todayMetrics.value.totalDurationMs],
    () => {
      syncAndAward()
    },
    { immediate: true },
  )

  return {
    taskItems,
    totalXp,
    level,
    currentLevelXp,
    streakDays,
    lastAwardedTaskIds,
  }
}

