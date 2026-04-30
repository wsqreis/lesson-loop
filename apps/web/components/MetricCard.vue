<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  helper: string
}>()
</script>

<template>
  <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-slate-950/20">
    <p class="text-sm text-slate-400">{{ label }}</p>
    <p class="mt-3 text-3xl font-bold text-white">{{ value }}</p>
    <p class="mt-2 text-sm text-slate-300">{{ helper }}</p>
  </article>
</template>
