<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">游戏大厅</h1>
      <p class="text-gray-400">即点即玩，支持 FC / MD / SFC / GB / GBA 五大经典平台</p>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          class="input-field"
          placeholder="搜索游戏名称..."
          @input="handleSearch"
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="p in platforms"
          :key="p.id"
          @click="filterByPlatform(p.id)"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
            currentPlatform === p.id
              ? platformActiveClass(p.id)
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          {{ p.label }}
        </button>
        <button
          @click="filterByPlatform('')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
            currentPlatform === ''
              ? 'bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          全部
        </button>
      </div>
    </div>

    <div v-if="authStore.isAuthenticated && recentGames.length > 0" class="mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">最近玩过</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="game in recentGames"
          :key="game.id"
          @click="goToGame(game.id)"
          class="card p-3 cursor-pointer hover:border-primary-500 transition-colors"
        >
          <div class="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
            <img v-if="game.cover_url" :src="game.cover_url" :alt="game.name" class="w-full h-full object-cover" />
            <span v-else class="text-4xl">🎮</span>
          </div>
          <p class="text-sm font-medium text-white truncate">{{ game.name }}</p>
          <span :class="platformBadgeClass(game.platform)">{{ platformLabel(game.platform) }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-400">加载中...</div>
    </div>

    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="game in games"
          :key="game.id"
          @click="goToGame(game.id)"
          class="card p-3 cursor-pointer hover:border-primary-500 transition-colors group"
        >
          <div class="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
            <img v-if="game.cover_url" :src="game.cover_url" :alt="game.name" class="w-full h-full object-cover" />
            <span v-else class="text-4xl">🎮</span>
            <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="text-white font-bold text-lg">开始游戏</span>
            </div>
          </div>
          <p class="text-sm font-medium text-white truncate">{{ game.name }}</p>
          <p v-if="game.name_en" class="text-xs text-gray-400 truncate">{{ game.name_en }}</p>
          <div class="flex items-center justify-between mt-1">
            <span :class="platformBadgeClass(game.platform)">{{ platformLabel(game.platform) }}</span>
            <span v-if="game.category" class="text-xs text-gray-500">{{ game.category }}</span>
          </div>
        </div>
      </div>

      <div v-if="games.length === 0" class="text-center py-12 text-gray-500">
        暂无游戏
      </div>

      <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8 space-x-2">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="btn-secondary text-sm"
        >
          上一页
        </button>
        <span class="px-4 py-2 text-gray-400 text-sm">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.totalPages"
          class="btn-secondary text-sm"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import type { Platform } from '@emu-matrix/shared'
import { PLATFORM_LABELS } from '@emu-matrix/shared'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const currentPlatform = ref<Platform | ''>('')
const platforms = [
  { id: 'nes' as Platform, label: 'FC / NES' },
  { id: 'md' as Platform, label: 'MD' },
  { id: 'snes' as Platform, label: 'SFC / SNES' },
  { id: 'gb' as Platform, label: 'GB / GBC' },
  { id: 'gba' as Platform, label: 'GBA' },
]

const games = ref(gameStore.games)
const recentGames = ref(gameStore.recentGames)
const pagination = ref(gameStore.pagination)
const loading = ref(gameStore.loading)

watch(() => gameStore.games, (v) => { games.value = v })
watch(() => gameStore.recentGames, (v) => { recentGames.value = v })
watch(() => gameStore.pagination, (v) => { pagination.value = v })
watch(() => gameStore.loading, (v) => { loading.value = v })

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadGames()
  }, 300)
}

function filterByPlatform(platform: Platform | '') {
  currentPlatform.value = platform
  loadGames()
}

function changePage(page: number) {
  loadGames(page)
}

function loadGames(page = 1) {
  gameStore.fetchGames({
    page,
    pageSize: 20,
    platform: currentPlatform.value || undefined,
    search: searchQuery.value || undefined,
  })
}

function goToGame(id: string) {
  router.push({ name: 'game-room', params: { id } })
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

function platformActiveClass(platform: Platform): string {
  const map: Record<Platform, string> = {
    nes: 'bg-red-600 text-white',
    md: 'bg-blue-600 text-white',
    snes: 'bg-green-600 text-white',
    gb: 'bg-purple-600 text-white',
    gba: 'bg-indigo-600 text-white',
  }
  return map[platform] || ''
}

onMounted(() => {
  loadGames()
  if (authStore.isAuthenticated) {
    gameStore.fetchRecentGames()
    gameStore.fetchFavorites()
  }
})
</script>
