<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryId, TimeEntry } from '../composables/useTimeTracker'
import { fmtDuration } from '../composables/useTimeTracker'
import PieChart from './PieChart.vue'

const props = defineProps<{
  store: Record<CategoryId, TimeEntry[]>
  overallTotalMs: number
  overallPct: Record<CategoryId, number>
  categoryTotalMs: Record<CategoryId, number>
  entryDurationMs: (e: TimeEntry) => number
  entrySharePctAll: (e: TimeEntry) => number
}>()

const pieItems = computed(() => {
  const items: Array<{ id: string; label: string; value: number }> = []
  for (const cat of ['meaningless', 'meaningful'] as const) {
    for (const e of props.store[cat]) {
      const v = props.entryDurationMs(e)
      if (v > 0) items.push({ id: e.id, label: e.title, value: v })
    }
  }
  items.sort((a, b) => b.value - a.value)
  return items
})
</script>

<template>
  <section class="card summary">
    <div class="head">
      <div>
        <div class="title">总结</div>
        <div class="hint">两类时间分别的占比，以及每个条目占今日总时间的占比（饼图+列表）。</div>
      </div>
      <div class="total">
        <div class="total-label">今日总计</div>
        <div class="total-value">{{ fmtDuration(overallTotalMs) }}</div>
      </div>
    </div>

    <div class="top">
      <PieChart :items="pieItems" :size="200" :stroke-width="28" />
      <div class="split">
        <div class="split-row">
          <div class="split-name">无意义时间</div>
          <div class="split-right">
            <span class="pill">{{ fmtDuration(categoryTotalMs.meaningless) }}</span>
            <span class="pill subtle">{{ overallPct.meaningless.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="bar">
          <div class="bar-fill" :style="{ width: overallPct.meaningless + '%' }" />
        </div>

        <div class="split-row" style="margin-top: 12px">
          <div class="split-name">有意义时间</div>
          <div class="split-right">
            <span class="pill">{{ fmtDuration(categoryTotalMs.meaningful) }}</span>
            <span class="pill subtle">{{ overallPct.meaningful.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="bar">
          <div class="bar-fill" :style="{ width: overallPct.meaningful + '%' }" />
        </div>
      </div>
    </div>

    <div class="lists">
      <div class="block">
        <div class="block-title">无意义时间条目</div>
        <div class="mini-list">
          <div v-for="e in store.meaningless" :key="e.id" class="mini-item">
            <div class="mini-left">
              <div class="mini-name">{{ e.title }}</div>
              <div class="mini-sub">{{ fmtDuration(entryDurationMs(e)) }}</div>
            </div>
            <div class="mini-right">
              <div class="mini-pct">{{ entrySharePctAll(e).toFixed(1) }}%</div>
              <div class="mini-bar">
                <div class="mini-bar-fill" :style="{ width: entrySharePctAll(e) + '%' }" />
              </div>
            </div>
          </div>
          <div v-if="store.meaningless.length === 0" class="empty">暂无</div>
        </div>
      </div>

      <div class="block">
        <div class="block-title">有意义时间条目</div>
        <div class="mini-list">
          <div v-for="e in store.meaningful" :key="e.id" class="mini-item">
            <div class="mini-left">
              <div class="mini-name">{{ e.title }}</div>
              <div class="mini-sub">{{ fmtDuration(entryDurationMs(e)) }}</div>
            </div>
            <div class="mini-right">
              <div class="mini-pct">{{ entrySharePctAll(e).toFixed(1) }}%</div>
              <div class="mini-bar">
                <div class="mini-bar-fill" :style="{ width: entrySharePctAll(e) + '%' }" />
              </div>
            </div>
          </div>
          <div v-if="store.meaningful.length === 0" class="empty">暂无</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  box-shadow: var(--shadow);
}

.summary {
  margin-top: 16px;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.title {
  font-size: 16px;
  font-weight: 800;
}
.hint {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.total {
  text-align: right;
}
.total-label {
  font-size: 12px;
  opacity: 0.7;
}
.total-value {
  font-size: 16px;
  font-weight: 900;
}

.top {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
}

@media (max-width: 980px) {
  .top {
    grid-template-columns: 1fr;
  }
  .total {
    text-align: left;
  }
}

.split-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.split-name {
  font-weight: 800;
}
.split-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bar {
  height: 8px;
  background: color-mix(in oklab, var(--border) 40%, transparent);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 55%, white));
}

.pill {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--panel) 50%, transparent);
  white-space: nowrap;
}
.pill.subtle {
  opacity: 0.75;
}

.lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 14px;
}
@media (max-width: 980px) {
  .lists {
    grid-template-columns: 1fr;
  }
}

.block-title {
  font-weight: 900;
  margin-bottom: 10px;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mini-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: color-mix(in oklab, var(--panel) 80%, transparent);
}
.mini-name {
  font-weight: 700;
}
.mini-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.75;
}
.mini-right {
  min-width: 140px;
  text-align: right;
  display: grid;
  gap: 6px;
}
.mini-pct {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
}
.mini-bar {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in oklab, var(--border) 40%, transparent);
}
.mini-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 55%, white));
}

.empty {
  font-size: 13px;
  opacity: 0.7;
  padding: 8px 0;
}
</style>

