<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { CategoryId, TimeEntry } from '../composables/useTimeTracker'
import { fmtDuration } from '../composables/useTimeTracker'
import EntryItem from './EntryItem.vue'

const props = defineProps<{
  catId: CategoryId
  catName: string
  catHint: string
  entries: TimeEntry[]
  categoryTotalMs: number
  categoryPct: number
  entryDurationMs: (e: TimeEntry) => number
  entrySharePctAll: (e: TimeEntry) => number
  isRunning: (e: TimeEntry) => boolean
  isEnded: (e: TimeEntry) => boolean
  onAdd: (payload: { title: string; content?: string }) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}>()

const form = reactive({ title: '', content: '' })
const canAdd = computed(() => form.title.trim().length > 0)

function submit() {
  if (!canAdd.value) return
  props.onAdd({ title: form.title, content: form.content })
  form.title = ''
  form.content = ''
}
</script>

<template>
  <section class="card">
    <div class="card-head">
      <div>
        <div class="card-title">{{ catName }}</div>
        <div class="card-hint">{{ catHint }}</div>
      </div>
      <div class="card-metrics">
        <div class="metric">
          <div class="metric-label">合计</div>
          <div class="metric-value">{{ fmtDuration(categoryTotalMs) }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">占比</div>
          <div class="metric-value">{{ categoryPct.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <div class="progress">
      <div class="progress-bar" :style="{ width: categoryPct + '%' }" />
    </div>

    <div class="add">
      <input v-model="form.title" class="input" placeholder="标题（必填）" @keydown.enter.prevent="submit" />
      <input v-model="form.content" class="input" placeholder="内容/备注（可选）" />
      <button class="btn primary" :disabled="!canAdd" @click="submit">新增</button>
    </div>

    <div class="list">
      <div v-if="entries.length === 0" class="empty">暂无条目。先在上方新增一个吧。</div>
      <EntryItem
        v-for="e in entries"
        :key="e.id"
        :entry="e"
        :entry-duration-ms="entryDurationMs(e)"
        :entry-share-pct-all="entrySharePctAll(e)"
        :running="isRunning(e)"
        :ended="isEnded(e)"
        @toggle="onToggle(e.id)"
        @remove="onRemove(e.id)"
      />
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

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}
.card-hint {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.card-metrics {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.metric {
  text-align: right;
}
.metric-label {
  font-size: 12px;
  opacity: 0.7;
}
.metric-value {
  font-weight: 700;
}

.progress {
  height: 8px;
  background: color-mix(in oklab, var(--border) 40%, transparent);
  border-radius: 999px;
  overflow: hidden;
  margin: 12px 0 10px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 60%, white));
}

.add {
  display: grid;
  grid-template-columns: 1.2fr 1.6fr auto;
  gap: 8px;
  margin-bottom: 12px;
}

@media (max-width: 560px) {
  .add {
    grid-template-columns: 1fr;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  font-size: 13px;
  opacity: 0.7;
  padding: 10px 0;
}

.input {
  width: 100%;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--input);
  color: inherit;
  outline: none;
}
.input:focus {
  border-color: color-mix(in oklab, var(--accent) 70%, var(--border));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
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
.btn.primary {
  border-color: color-mix(in oklab, var(--accent) 55%, var(--border));
  background: color-mix(in oklab, var(--accent) 16%, var(--btn));
}
</style>

