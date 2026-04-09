<script setup lang="ts">
import CategoryPanel from './components/CategoryPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import TaskPanel from './components/TaskPanel.vue'
import { useTasks } from './composables/useTasks.ts'
import { fmtDuration, useTimeTracker } from './composables/useTimeTracker.ts'

const {
  categories,
  selectedDate,
  availableDates,
  loading,
  error,
  store,
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
} = useTimeTracker()

const { taskItems, totalXp, level, currentLevelXp, streakDays } = useTasks({
  selectedDate,
  store,
  overallTotalMs,
})
</script>

<template>
  <div class="page">
    <header class="header">
      <div>
        <h1 class="title">认识到问题远比解决问题重要的多</h1>
        <p class="subtitle">分为“无意义（放松）”与“有意义（提升）”，支持新增条目、开始/结束计时、删除与占比统计。</p>
      </div>
      <div class="header-right">
        <label class="date-box">
          <span class="date-label">日期</span>
          <input v-model="selectedDate" class="date-input" type="date" />
        </label>
        <div class="stat">
          <div class="stat-label">今日总计</div>
          <div class="stat-value">{{ fmtDuration(overallTotalMs) }}</div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="notice">正在从本地存储加载 {{ selectedDate }} 的数据...</div>
    <div v-if="error" class="notice error">加载失败：{{ error }}</div>
    <div v-if="availableDates.length" class="notice soft">已记录日期：{{ availableDates.join('，') }}</div>

    <TaskPanel
      :selected-date="selectedDate"
      :task-items="taskItems"
      :total-xp="totalXp"
      :level="level"
      :current-level-xp="currentLevelXp"
      :streak-days="streakDays"
    />

    <main class="grid">
      <CategoryPanel
        v-for="cat in categories"
        :key="cat.id"
        :cat-id="cat.id"
        :cat-name="cat.name"
        :cat-hint="cat.hint"
        :entries="store[cat.id]"
        :category-total-ms="categoryTotalMs[cat.id]"
        :category-pct="overallPct[cat.id]"
        :entry-duration-ms="entryDurationMs"
        :entry-share-pct-all="entrySharePctAll"
        :is-running="isRunning"
        :is-ended="isEnded"
        :on-add="(payload) => addEntry(cat.id, payload)"
        :on-toggle="(id) => toggleStartStop(cat.id, id)"
        :on-remove="(id) => removeEntry(cat.id, id)"
      />
    </main>

    <SummaryPanel
      :store="store"
      :overall-total-ms="overallTotalMs"
      :overall-pct="overallPct"
      :category-total-ms="categoryTotalMs"
      :entry-duration-ms="entryDurationMs"
      :entry-share-pct-all="entrySharePctAll"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  line-height: 1.2;
  margin: 0;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.75;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.stat {
  text-align: right;
}
.stat-label {
  font-size: 12px;
  opacity: 0.7;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.date-box {
  display: grid;
  gap: 4px;
}

.date-label {
  font-size: 12px;
  opacity: 0.7;
}

.date-input {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--input);
  color: inherit;
}

.notice {
  margin: 0 0 10px;
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in oklab, var(--panel) 70%, transparent);
}

.notice.soft {
  opacity: 0.8;
}

.notice.error {
  border-color: color-mix(in oklab, var(--bad) 60%, var(--border));
  background: color-mix(in oklab, var(--bad) 12%, var(--panel));
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  .stat {
    text-align: left;
  }
}

</style>

