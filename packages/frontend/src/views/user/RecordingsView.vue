<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">云录像</h1>
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

    <div v-else-if="recordings.length === 0" class="text-center py-12 text-gray-500">暂无录像</div>

    <div v-else class="space-y-4">
      <div v-for="recording in recordings" :key="recording.id" class="card p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <span class="text-white font-medium">{{ recording.title || '未命名录像' }}</span>
              <span :class="platformBadgeClass(recording.platform as Platform)">{{ platformLabel(recording.platform as Platform) }}</span>
              <span v-if="recording.status === 'processing'" class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">处理中</span>
              <span v-else-if="recording.status === 'ready'" class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">就绪</span>
              <span v-else-if="recording.status === 'failed'" class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">失败</span>
            </div>
            <div class="text-gray-400 text-sm mt-1">
              {{ formatDate(recording.created_at) }}
              <span v-if="recording.duration" class="ml-2">时长: {{ formatDuration(recording.duration) }}</span>
              <span v-if="recording.file_size" class="ml-2">大小: {{ formatFileSize(recording.file_size) }}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button v-if="recording.status === 'ready'" @click="playRecording(recording)" class="btn-primary text-xs">播放</button>
            <button @click="deleteRecording(recording.id)" class="btn-danger text-xs">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8 space-x-2">
      <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="btn-secondary text-sm">上一页</button>
      <span class="px-4 py-2 text-gray-400 text-sm">{{ pagination.page }} / {{ pagination.totalPages }}</span>
      <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages" class="btn-secondary text-sm">下一页</button>
    </div>

    <div v-if="playingRecording" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50" @click.self="playingRecording = null">
      <div class="max-w-4xl w-full mx-4">
        <video :src="playingRecording.video_url" controls autoplay class="w-full rounded-lg" />
        <div class="flex justify-end mt-4">
          <button @click="playingRecording = null" class="btn-secondary text-sm">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { mediaApi } from '@/api/media'
import type { CloudRecording, Platform } from '@emu-matrix/shared'
import { PLATFORM_LABELS } from '@emu-matrix/shared'

const recordings = ref<CloudRecording[]>([])
const loading = ref(false)
const currentPlatform = ref<string>('')
const playingRecording = ref<CloudRecording | null>(null)
const pagination = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

const platformFilters = [
  { value: '', label: '全部' },
  { value: 'nes', label: 'FC' },
  { value: 'md', label: 'MD' },
  { value: 'snes', label: 'SFC' },
  { value: 'gb', label: 'GB' },
  { value: 'gba', label: 'GBA' },
]

watch(currentPlatform, () => loadRecordings(1))

async function loadRecordings(page = 1) {
  loading.value = true
  try {
    const response = await mediaApi.getRecordings({
      platform: (currentPlatform.value as Platform) || undefined,
      page,
      pageSize: 20,
    })
    if (response.success && response.data) {
      recordings.value = response.data.items
      pagination.value = {
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
      }
    }
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  loadRecordings(page)
}

function playRecording(recording: CloudRecording) {
  playingRecording.value = recording
}

async function deleteRecording(id: string) {
  if (!confirm('确定要删除此录像吗？')) return
  try {
    await mediaApi.deleteRecording(id)
    await loadRecordings(pagination.value.page)
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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onMounted(() => loadRecordings())
</script>
