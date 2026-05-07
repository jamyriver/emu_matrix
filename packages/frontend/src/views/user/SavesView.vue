<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">云存档</h1>
      <div class="flex gap-2">
        <button
          v-for="p in platformFilters"
          :key="p.value"
          @click="currentPlatform = p.value"
          :class="[
            'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
            currentPlatform === p.value ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">加载中...</div>

    <div v-else-if="savesList.length === 0" class="text-center py-12 text-gray-500">暂无存档</div>

    <div v-else class="space-y-4">
      <div v-for="save in savesList" :key="save.id" class="card p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-3">
              <span class="text-white font-medium">存档位 {{ save.slot_id }}</span>
              <span v-if="save.is_auto_save" class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">自动存档</span>
              <span :class="platformBadgeClass(save.platform as Platform)">{{ platformLabel(save.platform as Platform) }}</span>
            </div>
            <div class="text-gray-400 text-sm mt-1">
              {{ formatDate(save.updated_at) }}
              <span v-if="save.play_time > 0" class="ml-2">游戏时长: {{ formatPlayTime(save.play_time) }}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button @click="deleteSave(save.id)" class="btn-danger text-xs">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { savesApi } from '@/api/saves'
import type { CloudSave, Platform } from '@emu-matrix/shared'
import { PLATFORM_LABELS } from '@emu-matrix/shared'

const savesList = ref<CloudSave[]>([])
const loading = ref(false)
const currentPlatform = ref<string>('')

const platformFilters = [
  { value: '', label: '全部' },
  { value: 'nes', label: 'FC' },
  { value: 'md', label: 'MD' },
  { value: 'snes', label: 'SFC' },
  { value: 'gb', label: 'GB' },
  { value: 'gba', label: 'GBA' },
]

watch(currentPlatform, () => loadSaves())

async function loadSaves() {
  loading.value = true
  try {
    const response = await savesApi.getAllSaves()
    if (response.success && response.data) {
      savesList.value = currentPlatform.value
        ? response.data.filter((s) => s.platform === currentPlatform.value)
        : response.data
    }
  } finally {
    loading.value = false
  }
}

async function deleteSave(saveId: string) {
  if (!confirm('确定要删除此存档吗？')) return
  try {
    await savesApi.deleteSave(saveId)
    await loadSaves()
  } catch {
    alert('删除失败')
  }
}

function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform] || platform
}

function platformBadgeClass(platform: Platform): string {
  const map: Record<Platform, string> = {
    nes: 'platform-badge-nes',
    md: 'platform-badge-md',
    snes: 'platform-badge-snes',
    gb: 'platform-badge-gb',
    gba: 'platform-badge-gba',
  }
  return map[platform] || ''
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}

onMounted(loadSaves)
</script>
