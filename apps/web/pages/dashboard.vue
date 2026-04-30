<script setup lang="ts">
import type { ActivationChecklist, AiRecommendation, FunnelSummary } from '@lesson-loop/shared'

interface School {
  id: string
  name: string
  teachers: Array<{ id: string; name: string; email: string }>
  trials: unknown[]
  subscriptions: unknown[]
}

interface SchoolMetric {
  schoolId: string
  schoolName: string
  teachersInvited: number
  teachersOnboarded: number
  activeTeachers: number
  sessionsCreated: number
  answersSubmitted: number
  hasSubscription: boolean
}

interface Experiment {
  id: string
  name: string
  hypothesis: string
  variant: string
  metric: string
  isActive: boolean
}

const api = useApi()
const { data: funnel, refresh: refreshFunnel } = await useAsyncData('funnel', () =>
  api<FunnelSummary>('/analytics/funnel'),
)
const { data: recommendations, refresh: refreshRecommendations } = await useAsyncData('recommendations', () =>
  api<AiRecommendation[]>('/ai/recommendations'),
)
const { data: schools, refresh: refreshSchools } = await useAsyncData('schools', () => api<School[]>('/schools'))
const { data: schoolMetrics, refresh: refreshSchoolMetrics } = await useAsyncData('school-metrics', () =>
  api<SchoolMetric[]>('/analytics/schools'),
)
const { data: experiments } = await useAsyncData('experiments', () => api<Experiment[]>('/experiments'))
const { data: checklists, refresh: refreshChecklists } = await useAsyncData('activation-checklist', () =>
  api<ActivationChecklist[]>('/activation/checklist'),
)

const selectedSchoolId = computed(() => schools.value?.[0]?.id ?? '')
const invite = reactive({ name: 'Jordan Lee', email: 'jordan@northstar.example' })
const conversion = reactive({ plan: 'school' as const, seats: 12 })
const actionMessage = ref<string | null>(null)

async function refreshDashboard() {
  await Promise.all([
    refreshFunnel(),
    refreshRecommendations(),
    refreshSchools(),
    refreshSchoolMetrics(),
    refreshChecklists(),
  ])
}

async function inviteTeacher() {
  if (!selectedSchoolId.value) return
  await api(`/schools/${selectedSchoolId.value}/teachers`, { method: 'POST', body: invite })
  actionMessage.value = 'Teacher invite logged as an activation event.'
  await refreshDashboard()
}

async function convertSchool() {
  if (!selectedSchoolId.value) return
  await api(`/schools/${selectedSchoolId.value}/subscriptions`, { method: 'POST', body: conversion })
  actionMessage.value = 'Subscription conversion recorded for the selected school.'
  await refreshDashboard()
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 px-6 py-10 text-white">
    <section class="mx-auto max-w-6xl">
      <nav class="flex items-center justify-between">
        <NuxtLink class="font-bold text-cyan-300" to="/">LessonLoop</NuxtLink>
        <NuxtLink class="rounded-full border border-white/15 px-4 py-2 text-sm" to="/sessions">Session builder</NuxtLink>
      </nav>

      <header class="mt-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-cyan-300">Activation command center</p>
          <h1 class="mt-4 text-4xl font-bold">Teacher activation and conversion signals</h1>
        </div>
        <button class="rounded-full bg-white px-5 py-3 font-semibold text-slate-950" @click="refreshDashboard">Refresh data</button>
      </header>

      <section v-if="funnel" class="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Trials" :value="funnel.trialsStarted" helper="Schools entering guided evaluation" />
        <MetricCard label="Onboarded" :value="funnel.teachersOnboarded" helper="Teachers who completed first steps" />
        <MetricCard label="Sessions" :value="funnel.sessionsCreated" helper="Classroom moments created" />
        <MetricCard label="Answers" :value="funnel.answersSubmitted" helper="Student engagement events" />
        <MetricCard label="Conversion" :value="`${funnel.conversionRate}%`" helper="Trial to subscription" />
      </section>

      <section class="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div class="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 class="text-2xl font-bold">Teacher activation checklist</h2>
            <p class="mt-2 text-sm text-slate-400">Track the practical steps that turn one trial teacher into school-wide usage.</p>
          </div>
        </div>
        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <article v-for="checklist in checklists" :key="checklist.schoolId" class="rounded-2xl bg-slate-900 p-4">
            <div class="flex items-center justify-between gap-4">
              <h3 class="font-semibold">{{ checklist.schoolName }}</h3>
              <span class="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200">{{ checklist.completionRate }}%</span>
            </div>
            <p v-if="checklist.nextAction" class="mt-2 text-sm text-amber-200">Next action: {{ checklist.nextAction }}</p>
            <div class="mt-4 space-y-3">
              <div v-for="item in checklist.items" :key="item.key" class="flex gap-3 rounded-xl bg-slate-950/70 p-3">
                <span class="mt-1 h-3 w-3 rounded-full" :class="item.completed ? 'bg-emerald-300' : 'bg-slate-600'" />
                <div>
                  <p class="text-sm font-semibold">{{ item.label }}</p>
                  <p class="mt-1 text-xs text-slate-400">{{ item.helper }}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 class="text-2xl font-bold">School expansion metrics</h2>
          <div class="mt-5 space-y-3">
            <div v-for="metric in schoolMetrics" :key="metric.schoolId" class="rounded-2xl bg-slate-900 p-4">
              <div class="flex items-center justify-between gap-4">
                <p class="font-semibold">{{ metric.schoolName }}</p>
                <span class="rounded-full px-3 py-1 text-xs" :class="metric.hasSubscription ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'">{{ metric.hasSubscription ? 'Subscribed' : 'Trial' }}</span>
              </div>
              <p class="mt-2 text-sm text-slate-400">{{ metric.teachersOnboarded }}/{{ metric.teachersInvited }} teachers onboarded · {{ metric.activeTeachers }} active teachers</p>
              <p class="mt-1 text-sm text-slate-400">{{ metric.sessionsCreated }} sessions · {{ metric.answersSubmitted }} answers</p>
            </div>
          </div>
        </article>

        <article class="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 class="text-2xl font-bold">AI growth recommendations</h2>
          <div class="mt-5 space-y-4">
            <div v-for="recommendation in recommendations" :key="recommendation.title" class="rounded-2xl bg-slate-950/70 p-4">
              <p class="font-semibold text-cyan-200">{{ recommendation.title }}</p>
              <p class="mt-2 text-sm text-slate-300">{{ recommendation.rationale }}</p>
              <p class="mt-3 text-sm font-semibold text-white">{{ recommendation.action }}</p>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-2">
        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 class="text-2xl font-bold">Activation actions</h2>
          <p class="mt-2 text-sm text-slate-400">Run the school expansion motions that move a trial toward conversion.</p>
          <div class="mt-5 grid gap-3 md:grid-cols-2">
            <input v-model="invite.name" class="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" placeholder="Teacher name" />
            <input v-model="invite.email" class="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" placeholder="Teacher email" />
          </div>
          <div class="mt-4 flex flex-wrap gap-3">
            <button class="rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950" @click="inviteTeacher">Invite teacher</button>
            <button class="rounded-full bg-white px-5 py-3 font-semibold text-slate-950" @click="convertSchool">Convert trial</button>
          </div>
          <p v-if="actionMessage" class="mt-4 rounded-2xl bg-emerald-400/10 p-4 text-emerald-200">{{ actionMessage }}</p>
        </article>

        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 class="text-2xl font-bold">Growth experiments</h2>
          <div class="mt-5 space-y-3">
            <div v-for="experiment in experiments" :key="experiment.id" class="rounded-2xl bg-slate-900 p-4">
              <p class="font-semibold">{{ experiment.name }}</p>
              <p class="mt-2 text-sm text-slate-300">{{ experiment.hypothesis }}</p>
              <p class="mt-3 text-sm text-cyan-200">Variant: {{ experiment.variant }} · Metric: {{ experiment.metric }}</p>
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
