<script setup lang="ts">
const api = useApi()
const form = reactive({
  schoolName: 'Riverbend Primary',
  country: 'United States',
  teacherName: 'Avery Brooks',
  teacherEmail: 'avery@riverbend.example',
})
const isSubmitting = ref(false)
const result = ref<string | null>(null)

async function startTrial() {
  isSubmitting.value = true
  result.value = null
  const school = await api<{ id: string; name: string }>('/trials', {
    method: 'POST',
    body: form,
  })
  result.value = `${school.name} is ready for onboarding.`
  isSubmitting.value = false
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <section class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">LessonLoop</p>
        <h1 class="mt-6 text-5xl font-bold tracking-tight lg:text-6xl">Activate more teachers through every trial.</h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Launch guided school trials, help teachers run their first interactive classroom sessions, and turn engagement data into conversion-ready insight.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink class="rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950" to="/dashboard">View dashboard</NuxtLink>
          <NuxtLink class="rounded-full border border-white/15 px-5 py-3 font-semibold text-white" to="/sessions">Build a session</NuxtLink>
        </div>
      </div>

      <form class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30" @submit.prevent="startTrial">
        <h2 class="text-2xl font-bold">Start a school trial</h2>
        <div class="mt-6 space-y-4">
          <label class="block text-sm text-slate-300">School name<input v-model="form.schoolName" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label>
          <label class="block text-sm text-slate-300">Country<input v-model="form.country" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label>
          <label class="block text-sm text-slate-300">Teacher name<input v-model="form.teacherName" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label>
          <label class="block text-sm text-slate-300">Teacher email<input v-model="form.teacherEmail" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" /></label>
        </div>
        <button class="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 disabled:opacity-60" :disabled="isSubmitting">{{ isSubmitting ? 'Starting trial...' : 'Start trial' }}</button>
        <p v-if="result" class="mt-4 rounded-2xl bg-emerald-400/10 p-4 text-emerald-200">{{ result }}</p>
      </form>
    </section>
  </main>
</template>
