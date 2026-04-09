<script setup lang="ts">
import { computed } from 'vue'

type PieItem = {
  id: string
  label: string
  value: number
  color?: string
}

const props = withDefaults(
  defineProps<{
    items: PieItem[]
    size?: number
    strokeWidth?: number
    minSlicePct?: number
    showLegend?: boolean
    maxLegendItems?: number
  }>(),
  {
    size: 180,
    strokeWidth: 26,
    minSlicePct: 1.2,
    showLegend: true,
    maxLegendItems: 12,
  },
)

const PALETTE = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#eab308',
  '#14b8a6',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f43f5e',
] as const

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function hashColor(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 85% 60%)`
}

const normalized = computed(() => {
  const filtered = props.items.filter((x) => x.value > 0)
  const total = filtered.reduce((s, x) => s + x.value, 0)
  if (!total) return { total: 0, slices: [] as Array<PieItem & { frac: number }> }

  const tmp = filtered.map((x, idx) => ({
    ...x,
    frac: x.value / total,
    color: x.color ?? PALETTE[idx % PALETTE.length] ?? hashColor(x.id),
  }))
  const small: (PieItem & { frac: number })[] = []
  const big: (PieItem & { frac: number })[] = []
  for (const it of tmp) {
    if (it.frac * 100 < props.minSlicePct) small.push(it)
    else big.push(it)
  }
  if (small.length) {
    const otherValue = small.reduce((s, x) => s + x.value, 0)
    const otherFrac = otherValue / total
    big.push({
      id: '__other__',
      label: `其它（${small.length}项）`,
      value: otherValue,
      frac: otherFrac,
      color: '#94a3b8',
    })
  }
  big.sort((a, b) => b.value - a.value)
  return { total, slices: big }
})

const chart = computed(() => {
  const r = (props.size - props.strokeWidth) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  const slices = normalized.value.slices.map((s) => {
    const start = acc
    const frac = clamp01(s.frac)
    const dash = `${frac * c} ${c}`
    acc += frac
    const rotate = start * 360 - 90
    return { ...s, dash, rotate }
  })
  return { r, c, slices }
})

const legendItems = computed(() => {
  const slices = normalized.value.slices
  if (!props.showLegend) return []
  return slices.slice(0, props.maxLegendItems)
})
</script>

<template>
  <div class="wrap">
    <div class="chart" :style="{ width: size + 'px', height: size + 'px' }">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="svg" role="img" aria-label="条目时间占比饼图">
        <circle class="bg" :cx="size / 2" :cy="size / 2" :r="chart.r" :stroke-width="strokeWidth" fill="none" />
        <circle
          v-for="s in chart.slices"
          :key="s.id"
          class="slice"
          :cx="size / 2"
          :cy="size / 2"
          :r="chart.r"
          :stroke="s.color"
          :stroke-width="strokeWidth"
          :stroke-dasharray="s.dash"
          :transform="`rotate(${s.rotate} ${size / 2} ${size / 2})`"
          fill="none"
        />
      </svg>
      <div class="center">
        <div class="center-label">总计</div>
        <div class="center-value">{{ normalized.total ? '100%' : '—' }}</div>
      </div>
    </div>

    <div v-if="legendItems.length" class="legend">
      <div v-for="it in legendItems" :key="it.id" class="legend-row">
        <span class="swatch" :style="{ background: it.color }" />
        <span class="name" :title="it.label">{{ it.label }}</span>
        <span class="pct">{{ ((it.value / normalized.total) * 100).toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
}

@media (max-width: 720px) {
  .wrap {
    grid-template-columns: 1fr;
  }
}

.chart {
  position: relative;
  display: grid;
  place-items: center;
}

.svg {
  display: block;
}

.bg {
  stroke: color-mix(in oklab, var(--border) 55%, transparent);
}

.slice {
  stroke-linecap: butt;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.25));
}

.center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  pointer-events: none;
}

.center-label {
  font-size: 12px;
  opacity: 0.7;
}
.center-value {
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.legend {
  display: grid;
  gap: 8px;
  align-content: start;
  max-height: 220px;
  overflow: auto;
  padding-right: 6px;
}

.legend-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 8px;
  align-items: center;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.name {
  font-size: 13px;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pct {
  font-size: 12px;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}
</style>

