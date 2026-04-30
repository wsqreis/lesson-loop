<script setup lang="ts">
type BoardAnswer = {
  id: string
  activityId: string
  studentCode: string
  answer: string
  isCorrect: boolean
  submittedAt: string
}

type BoardActivity = {
  id: string
  prompt: string
  kind: string
}

type BoardSession = {
  id: string
  joinCode: string
  title: string
  subject: string
  grade: string
  activities: BoardActivity[]
  answers: BoardAnswer[]
  teacher: { name: string }
  school: { name: string }
}

const route = useRoute()
const api = useApi()
const sessionId = computed(() => String(route.params.id))
const { data: session, refresh } = await useAsyncData(`board-${sessionId.value}`, () =>
  api<BoardSession>(`/sessions/${sessionId.value}`),
)

const selectedActivityId = ref<string | null>(null)
const selectedActivity = computed(() => {
  const activities = session.value?.activities ?? []
  return activities.find((activity) => activity.id === selectedActivityId.value) ?? activities[0]
})
const visibleAnswers = computed(() => {
  const activityId = selectedActivity.value?.id
  const answers = session.value?.answers ?? []
  return activityId ? answers.filter((answer) => answer.activityId === activityId) : answers
})
const totalAnswers = computed(() => session.value?.answers.length ?? 0)
const correctAnswers = computed(() => session.value?.answers.filter((answer) => answer.isCorrect).length ?? 0)
const incorrectAnswers = computed(() => totalAnswers.value - correctAnswers.value)
const percentCorrect = computed(() =>
  totalAnswers.value === 0 ? 0 : Math.round((correctAnswers.value / totalAnswers.value) * 100),
)

async function refreshBoard() {
  await refresh()
}

let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  interval = setInterval(() => refresh(), 5000)
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 px-6 py-8 text-white">
    <section class="mx-auto max-w-6xl">
      <nav class="flex items-center justify-between">
        <NuxtLink class="font-bold text-cyan-300" to="/sessions">Back to sessions</NuxtLink>
        <button class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" @click="refreshBoard">Refresh board</button>
      </nav>

      <section v-if="session" class="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article class="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <p class="text-sm uppercase tracking-[0.3em] text-cyan-200">Live board</p>
          <h1 class="mt-4 text-5xl font-bold tracking-tight">{{ session.title }}</h1>
          <p class="mt-3 text-lg text-slate-300">{{ session.school.name }} · {{ session.teacher.name }} · {{ session.subject }} · {{ session.grade }}</p>
          <div class="mt-8 rounded-3xl bg-slate-950/80 p-6 text-center">
            <p class="text-sm uppercase tracking-[0.25em] text-slate-400">Student join code</p>
            <p class="mt-3 text-7xl font-black tracking-widest text-cyan-200">{{ session.joinCode }}</p>
          </div>

          <div class="mt-8">
            <label class="text-sm text-slate-300">Current activity</label>
            <select v-model="selectedActivityId" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
              <option v-for="activity in session.activities" :key="activity.id" :value="activity.id">{{ activity.prompt }}</option>
            </select>
            <div v-if="selectedActivity" class="mt-4 rounded-3xl bg-white p-6 text-slate-950">
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Prompt</p>
              <p class="mt-3 text-3xl font-bold">{{ selectedActivity.prompt }}</p>
            </div>
          </div>
        </article>

        <aside class="space-y-6">
          <section class="grid grid-cols-2 gap-3">
            <MetricCard label="Answers" :value="totalAnswers" helper="Submitted in this session" />
            <MetricCard label="Correct" :value="`${percentCorrect}%`" helper="Correct answer rate" />
            <MetricCard label="Right" :value="correctAnswers" helper="Marked correct" />
            <MetricCard label="Needs help" :value="incorrectAnswers" helper="Marked incorrect" />
          </section>

          <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 class="text-2xl font-bold">Recent answer stream</h2>
            <div class="mt-5 space-y-3">
              <div v-for="answer in visibleAnswers.slice(0, 8)" :key="answer.id" class="rounded-2xl bg-slate-900 p-4">
                <div class="flex items-center justify-between gap-4">
                  <p class="font-semibold">{{ answer.studentCode }}</p>
                  <span class="rounded-full px-3 py-1 text-xs" :class="answer.isCorrect ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'">{{ answer.isCorrect ? 'Correct' : 'Review' }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-300">{{ answer.answer }}</p>
              </div>
              <p v-if="visibleAnswers.length === 0" class="text-sm text-slate-400">No answers yet. Ask students to join with the code above.</p>
            </div>
          </article>
        </aside>
      </section>
    </section>
  </main>
</template>
