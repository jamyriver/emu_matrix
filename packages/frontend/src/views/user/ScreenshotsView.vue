<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-white">云截图</h1>
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

    <div v-else-if="screenshots.length === 0" class="text-center py-12 text-gray-500">暂无截图</div>

    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div
          v-for="screenshot in screenshots"
          :key="screenshot.id"
          class="card overflow-hidden group cursor-pointer"
          @click="viewScreenshot(screenshot)"
        >
          <div class="aspect-video bg-gray-700 flex items-center justify-center overflow-hidden">
            <img :src="screenshot.thumbnail_url || screenshot.screenshot_url" :alt="screenshot.description || '截图'" class="w-full h-full object-cover" />
          </div>
          <div class="p-2">
            <span :class="platformBadgeClass(screenshot.platform as Platform)">{{ platformLabel(screenshot.platform as Platform) }}</span>
            <p class="text-gray-400 text-xs mt-1">{{ formatDate(screenshot.created_at) }}</p>
          </div>
        </div>
      </div>

      <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8 space-x-2">
        <button @click="changePage(pagination.page - 1)" :disabled="pagination.page <= 1" class="btn-secondary text-sm">上一页</button>
        <span class="px-4 py-2 text-gray-400 text-sm">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button @click="changePage(pagination.page + 1)" :disabled="pagination.page >= pagination.totalPages" class="btn-secondary text-sm">下一页</button>
      </div>
    </div>

    <div v-if="selectedScreenshot" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" @click.self="selectedScreenshot = null">
      <div class="max-w-4xl w-full mx-4">
        <img :src="selectedScreenshot.screenshot_url" class="w-full" />
        <div class="flex justify-between items-center mt-4">
          <div class="text-gray-300">
            <span :class="platformBadgeClass(selectedScreenshot.platform as Platform)">{{ platformLabel(selectedScreenshot.platform as Platform) }}</span>
            <span class="ml-2 text-sm">{{ formatDate(selectedScreenshot.created_at) }}</span>
          </div>
          <div class="flex space-x-2">
            <a :href="selectedScreenshot.screenshot_url" download class="btn-secondary text-sm" target="_blank">下载</a>
            <button @click="deleteScreenshot(selectedScreenshot.id)" class="btn-danger text-sm">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { mediaApi } from '@/api/media'
import type { CloudScreenshot, Platform, PaginatedResponse } from '@emu-matrix/shared'
import { PLATFORM_LABELS } from '@emu-matrix/shared'

const screenshots = ref<CloudScreenshot[]>([])
const loading = ref(false)
const currentPlatform = ref<string>('')
const selectedScreenshot = ref<CloudScreenshot | null>(null)
const pagination = ref({ total: 0, page: 1, pageSize: 20, totalPages: 0 })

const platformFilters = [
  { value: '', label: '全部' },
  { value: 'nes', label: 'FC' },
  { value: 'md', label: 'MD' },
  { value: 'snes', label: 'SFC' },
  { value: 'gb', label: 'GB' },
  { value: 'gba', label: 'GBA' },
]

watch(currentPlatform, () => loadScreenshots(1))

async function loadScreenshots(page = 1) {
  loading.value = true
  try {
    const response = await mediaApi.getScreenshots({
      platform: (currentPlatform.value as Platform) || undefined,
      page,
      pageSize: 20,
    })
    if (response.success && response.data) {
      screenshots.value = response.data.items
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
  loadScreenshots(page)
}

function viewScreenshot(screenshot: CloudScreenshot) {
  selectedScreenshot.value = screenshot
}

async function deleteScreenshot(id: string) {
  if (!confirm('确定要删除此截图吗？')) return
  try {
    await mediaApi.deleteScreenshot(id)
    selectedScreenshot.value = null
    await loadScreenshots(pagination.value.page)
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

onMounted(() => loadScreenshots())
</script>
