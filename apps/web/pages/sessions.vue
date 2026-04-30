<script setup lang="ts">
const api = useApi()
const { data: schools } = await useAsyncData('session-schools', () =>
  api<Array<{ id: string; name: string; teachers: Array<{ id: string; name: string }> }>>('/schools'),
)
const { data: sessions, refresh } = await useAsyncData('sessions', () =>
  api<Array<{ id: string; joinCode: string; title: string; subject: string; grade: string; activities: Array<{ id: string; prompt: string }>; answers: unknown[]; teacher: { name: string }; school: { name: string } }>>('/sessions'),
)

const selectedSchoolId = computed(() => schools.value?.[0]?.id ?? '')
const selectedTeacherId = computed(() => schools.value?.[0]?.teachers[0]?.id ?? '')
const form = reactive({
  title: 'Reading Exit Ticket',
  subject: 'Language Arts',
  grade: 'Grade 5',
  prompt: 'What is the strongest evidence for the main idea?',
})
const answer = reactive({
  studentCode: 'S-2042',
  text: 'The repeated detail in paragraph three supports the main idea.',
  isCorrect: true,
})
const message = ref<string | null>(null)

async function createSession() {
  if (!selectedSchoolId.value || !selectedTeacherId.value) return
  await api('/sessions', {
    method: 'POST',
    body: {
      schoolId: selectedSchoolId.value,
      teacherId: selectedTeacherId.value,
      title: form.title,
      subject: form.subject,
      grade: form.grade,
      activities: [{ prompt: form.prompt, kind: 'open_response' }],
    },
  })
  message.value = 'Session created and counted toward activation.'
  await refresh()
}

async function submitAnswer(sessionId: string, activityId: string) {
  await api('/answers', {
    method: 'POST',
    body: {
      sessionId,
      activityId,
      studentCode: answer.studentCode,
      answer: answer.text,
      isCorrect: answer.isCorrect,
    },
  })
  message.value = 'Student answer captured for engagement analytics.'
  await refresh()
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 px-6 py-10 text-white">
    <section class="mx-auto max-w-6xl">
      <nav class="flex items-center justify-between">
        <NuxtLink class="font-bold text-cyan-300" to="/">LessonLoop</NuxtLink>
        <NuxtLink class="rounded-full border border-white/15 px-4 py-2 text-sm" to="/dashboard">Dashboard</NuxtLink>
      </nav>

      <header class="mt-10">
        <p class="text-sm uppercase tracking-[0.3em] text-cyan-300">Classroom product</p>
        <h1 class="mt-4 text-4xl font-bold">Create a session and capture answer signals</h1>
      </header>

      <section class="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form class="rounded-3xl border border-white/10 bg-white/[0.06] p-6" @submit.prevent="createSession">
          <h2 class="text-2xl font-bold">Session builder</h2>
          <div class="mt-5 space-y-4">
            <label class="block text-sm text-slate-300">Title<input v-model="form.title" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" /></label>
            <label class="block text-sm text-slate-300">Subject<input v-model="form.subject" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" /></label>
            <label class="block text-sm text-slate-300">Grade<input v-model="form.grade" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" /></label>
            <label class="block text-sm text-slate-300">Activity prompt<textarea v-model="form.prompt" class="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" /></label>
          </div>
          <button class="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950">Create session</button>
          <p v-if="message" class="mt-4 rounded-2xl bg-emerald-400/10 p-4 text-emerald-200">{{ message }}</p>
        </form>

        <div class="space-y-4">
          <article v-for="session in sessions" :key="session.id" class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div class="flex flex-col justify-between gap-3 md:flex-row">
              <div>
                <p class="text-sm text-slate-400">{{ session.school.name }} · {{ session.teacher.name }}</p>
                <h2 class="mt-1 text-2xl font-bold">{{ session.title }}</h2>
                <p class="mt-1 text-sm text-cyan-200">{{ session.subject }} · {{ session.grade }}</p>
                <p class="mt-3 inline-flex rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200">Join code: {{ session.joinCode }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <NuxtLink class="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950" :to="`/sessions/${session.id}/board`">Open board</NuxtLink>
                <p class="rounded-full bg-white/10 px-4 py-2 text-sm">{{ session.answers.length }} answers</p>
              </div>
            </div>
            <div class="mt-5 space-y-3">
              <div v-for="activity in session.activities" :key="activity.id" class="rounded-2xl bg-slate-900 p-4">
                <p class="text-slate-200">{{ activity.prompt }}</p>
                <button class="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" @click="submitAnswer(session.id, activity.id)">Submit sample answer</button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
