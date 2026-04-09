<script setup lang="ts">
import type { TimeEntry } from '../composables/useTimeTracker'
import { fmtDuration, fmtHms } from '../composables/useTimeTracker'

defineProps<{
  entry: TimeEntry
  entryDurationMs: number
  entrySharePctAll: number
  running: boolean
  ended: boolean
}>()

defineEmits<{
  toggle: []
  remove: []
}>()
</script>

<template>
  <article class="item">
    <div class="item-main">
      <div class="item-top">
        <div class="item-title">
          <span class="dot" :class="{ running }" />
          {{ entry.title }}
        </div>
        <div class="item-right">
          <div class="pill">{{ fmtDuration(entryDurationMs) }}</div>
          <div class="pill subtle">{{ entrySharePctAll.toFixed(1) }}%</div>
        </div>
      </div>

      <div v-if="entry.content" class="item-content">{{ entry.content }}</div>

      <div class="times">
        <label class="time-field">
          <span>开始</span>
          <div class="time-val">{{ fmtHms(entry.startMs) }}</div>
        </label>
        <label class="time-field">
          <span>结束</span>
          <div class="time-val">{{ running ? '进行中' : fmtHms(entry.endMs) }}</div>
        </label>
      </div>
    </div>

    <div class="item-actions">
      <button class="btn" :disabled="ended" @click="$emit('toggle')">
        {{ running ? '结束' : ended ? '已结束' : '开始' }}
      </button>
      <button class="btn danger" @click="$emit('remove')">删除</button>
    </div>
  </article>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: color-mix(in oklab, var(--panel) 80%, transparent);
}

.item-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--border) 70%, transparent);
}
.dot.running {
  background: var(--good);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--good) 25%, transparent);
}

.item-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.item-content {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.85;
}

.times {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 560px) {
  .times {
    grid-template-columns: 1fr;
  }
}

.time-field {
  display: grid;
  gap: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.time-val {
  width: 100%;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--input);
  font-variant-numeric: tabular-nums;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  justify-content: flex-start;
}

.btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--btn);
  color: inherit;
  cursor: pointer;
  font-weight: 600;
}
.btn:hover {
  border-color: color-mix(in oklab, var(--accent) 30%, var(--border));
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.btn.danger {
  border-color: color-mix(in oklab, var(--bad) 55%, var(--border));
  background: color-mix(in oklab, var(--bad) 12%, var(--btn));
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
</style>

