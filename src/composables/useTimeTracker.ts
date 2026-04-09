import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

export type CategoryId = 'meaningless' | 'meaningful'

export type TimeEntry = {
  id: string
  title: string
  content: string
  startMs: number | null
  endMs: number | null
  createdAt: number
}

export type StoreShape = Record<CategoryId, TimeEntry[]>

export type CategoryMeta = {
  id: CategoryId
  name: string
  hint: string
}

type PersistShape = Record<string, StoreShape>

const STORAGE_KEY = 'time-tracker:v2-by-date'

function toDateText(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function emptyStore(): StoreShape {
  return { meaningless: [], meaningful: [] }
}

function sanitizeStore(value: unknown): StoreShape {
  const safe = emptyStore()
  if (!value || typeof value !== 'object') return safe
  const obj = value as Partial<StoreShape>
  for (const cat of ['meaningless', 'meaningful'] as const) {
    const arr = obj[cat]
    if (!Array.isArray(arr)) continue
    safe[cat] = arr
      .filter(Boolean)
      .map((e: any) => ({
        id: String(e.id ?? newId()),
        title: String(e.title ?? ''),
        content: String(e.content ?? ''),
        startMs: typeof e.startMs === 'number' ? e.startMs : null,
        endMs: typeof e.endMs === 'number' ? e.endMs : null,
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      }))
  }
  return safe
}

function readPersist(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const result: PersistShape = {}
    for (const [date, value] of Object.entries(parsed as Record<string, unknown>)) {
      result[date] = sanitizeStore(value)
    }
    return result
  } catch {
    return {}
  }
}

function writePersist(data: PersistShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function fmtHms(ms: number | null) {
  if (!ms) return '--:--:--'
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function fmtDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}小时${String(m).padStart(2, '0')}分`
  if (m > 0) return `${m}分${String(s).padStart(2, '0')}秒`
  return `${s}秒`
}

function clampPct(p: number) {
  if (!Number.isFinite(p)) return 0
  return Math.max(0, Math.min(100, p))
}

export function useTimeTracker() {
  const categories: CategoryMeta[] = [
    { id: 'meaningless', name: '无意义时间（放松）', hint: '如刷短视频、闲聊、纯娱乐等' },
    { id: 'meaningful', name: '有意义时间（提升自我）', hint: '如学习、健身、阅读、项目实践等' },
  ]

  const selectedDate = ref(toDateText(new Date()))
  const availableDates = ref<string[]>([])
  const loading = ref(false)
  const error = ref('')

  const store = reactive<StoreShape>({
    meaningless: [],
    meaningful: [],
  })

  function setStoreValue(next: StoreShape) {
    store.meaningless = next.meaningless
    store.meaningful = next.meaningful
  }

  function loadDates() {
    const data = readPersist()
    availableDates.value = Object.keys(data).sort((a, b) => b.localeCompare(a))
  }

  async function loadEntries(dateText = selectedDate.value) {
    loading.value = true
    error.value = ''
    try {
      const data = readPersist()
      const current = sanitizeStore(data[dateText] ?? emptyStore())
      setStoreValue(current)
      loadDates()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  function persistCurrentDate() {
    const data = readPersist()
    data[selectedDate.value] = {
      meaningless: [...store.meaningless],
      meaningful: [...store.meaningful],
    }
    writePersist(data)
    loadDates()
  }

  watch(selectedDate, async (dateText) => {
    await loadEntries(dateText)
  })

  const nowMs = ref(Date.now())
  let timer: number | undefined
  onMounted(async () => {
    await loadEntries(selectedDate.value)
    timer = window.setInterval(() => {
      nowMs.value = Date.now()
    }, 1000)
  })
  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
  })

  function isRunning(e: TimeEntry) {
    return e.startMs != null && e.endMs == null
  }

  function isEnded(e: TimeEntry) {
    return e.startMs != null && e.endMs != null
  }

  function entryDurationMs(e: TimeEntry) {
    if (e.startMs == null) return 0
    const end = e.endMs ?? nowMs.value
    return Math.max(0, end - e.startMs)
  }

  async function removeEntry(cat: CategoryId, id: string) {
    store[cat] = store[cat].filter((x) => x.id !== id)
    persistCurrentDate()
  }

  async function addEntry(cat: CategoryId, payload: { title: string; content?: string }) {
    const title = payload.title.trim()
    const content = (payload.content ?? '').trim()
    if (!title) return
    store[cat].unshift({
      id: newId(),
      title,
      content,
      startMs: null,
      endMs: null,
      createdAt: Date.now(),
    })
    persistCurrentDate()
  }

  async function toggleStartStop(cat: CategoryId, id: string) {
    const e = store[cat].find((x) => x.id === id)
    if (!e) return
    if (isEnded(e)) return

    const now = Date.now()
    if (isRunning(e)) {
      e.endMs = now
    } else {
      for (const c of ['meaningless', 'meaningful'] as const) {
        for (const item of store[c]) {
          if (item.id !== id && item.startMs != null && item.endMs == null) item.endMs = now
        }
      }
      e.startMs = now
      e.endMs = null
    }
    persistCurrentDate()
  }

  const categoryTotalMs = computed(() => {
    return {
      meaningless: store.meaningless.reduce((sum, e) => sum + entryDurationMs(e), 0),
      meaningful: store.meaningful.reduce((sum, e) => sum + entryDurationMs(e), 0),
    }
  })

  const overallTotalMs = computed(() => categoryTotalMs.value.meaningless + categoryTotalMs.value.meaningful)

  const overallPct = computed(() => {
    const total = overallTotalMs.value
    const meaningless = total ? (categoryTotalMs.value.meaningless / total) * 100 : 0
    const meaningful = total ? (categoryTotalMs.value.meaningful / total) * 100 : 0
    return {
      meaningless: clampPct(meaningless),
      meaningful: clampPct(meaningful),
    }
  })

  function entrySharePctAll(e: TimeEntry) {
    const total = overallTotalMs.value
    const d = entryDurationMs(e)
    return total ? clampPct((d / total) * 100) : 0
  }

  return {
    categories,
    selectedDate,
    availableDates,
    loading,
    error,
    store,
    nowMs,
    loadEntries,
    addEntry,
    removeEntry,
    toggleStartStop,
    isRunning,
    isEnded,
    entryDurationMs,
    entrySharePctAll,
    categoryTotalMs,
    overallTotalMs,
    overallPct,
  }
}

