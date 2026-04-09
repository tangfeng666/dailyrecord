<script setup lang="ts">
import type { TaskItemView } from '../composables/useTasks.ts'

defineProps<{
  selectedDate: string
  level: number
  totalXp: number
  currentLevelXp: number
  streakDays: number
  taskItems: TaskItemView[]
}>()
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <div class="title">每日任务</div>
        <div class="hint">通过完成记录任务获取 XP，持续记录会累计连续天数。</div>
      </div>
      <div class="meta">
        <div class="badge">Lv.{{ level }}</div>
        <div class="badge">{{ totalXp }} XP</div>
        <div class="badge streak">连续 {{ streakDays }} 天</div>
      </div>
    </div>

    <div class="xp-line">
      <div class="xp-fill" :style="{ width: currentLevelXp + '%' }" />
    </div>
    <div class="date">任务日期：{{ selectedDate }}</div>

    <div class="tasks">
      <article v-for="t in taskItems" :key="t.id" class="task" :class="{ done: t.completed }">
        <div class="task-row">
          <div class="task-title">{{ t.title }}</div>
          <div class="task-right">
            <span class="reward">+{{ t.rewardXp }} XP</span>
            <span class="status">{{ t.completed ? '已完成' : t.progressText }}</span>
          </div>
        </div>
        <div class="progress">
          <div class="progress-fill" :style="{ width: (t.completed ? 100 : t.progressPct) + '%' }" />
        </div>
      </article>
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
  margin-bottom: 12px;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
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

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  background: color-mix(in oklab, var(--panel) 70%, transparent);
}
.badge.streak {
  border-color: color-mix(in oklab, var(--good) 50%, var(--border));
}

.xp-line {
  margin-top: 10px;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in oklab, var(--border) 40%, transparent);
}
.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--good), color-mix(in oklab, var(--good) 50%, white));
}

.date {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.75;
}

.tasks {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}
.task.done {
  border-color: color-mix(in oklab, var(--good) 55%, var(--border));
  background: color-mix(in oklab, var(--good) 10%, transparent);
}

.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.task-title {
  font-weight: 700;
}
.task-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reward {
  font-size: 12px;
  opacity: 0.8;
}
.status {
  font-size: 12px;
  font-weight: 700;
}

.progress {
  margin-top: 8px;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in oklab, var(--border) 40%, transparent);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 55%, white));
}

@media (max-width: 980px) {
  .head {
    flex-direction: column;
  }
  .meta {
    justify-content: flex-start;
  }
}
</style>

