<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-white mb-8">个人中心</h1>

    <div v-if="authStore.user" class="card p-6 mb-8">
      <div class="flex items-center space-x-6">
        <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl">
          {{ authStore.user.username.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h2 class="text-2xl font-bold text-white">{{ authStore.user.username }}</h2>
          <p class="text-gray-400">{{ authStore.user.email }}</p>
          <p class="text-gray-500 text-sm">注册于 {{ formatDate(authStore.user.created_at) }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <router-link to="/saves" class="card p-6 hover:border-primary-500 transition-colors cursor-pointer">
        <div class="text-4xl mb-3">💾</div>
        <h3 class="text-lg font-semibold text-white">云存档</h3>
        <p class="text-gray-400 text-sm mt-1">管理你的游戏存档，跨设备同步</p>
      </router-link>

      <router-link to="/screenshots" class="card p-6 hover:border-primary-500 transition-colors cursor-pointer">
        <div class="text-4xl mb-3">📸</div>
        <h3 class="text-lg font-semibold text-white">云截图</h3>
        <p class="text-gray-400 text-sm mt-1">查看和管理你的游戏截图</p>
      </router-link>

      <router-link to="/recordings" class="card p-6 hover:border-primary-500 transition-colors cursor-pointer">
        <div class="text-4xl mb-3">🎬</div>
        <h3 class="text-lg font-semibold text-white">云录像</h3>
        <p class="text-gray-400 text-sm mt-1">回放你的精彩游戏时刻</p>
      </router-link>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-semibold text-white mb-4">我的收藏</h2>
      <div v-if="favoriteGames.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div
          v-for="game in favoriteGames"
          :key="game.id"
          @click="$router.push({ name: 'game-room', params: { id: game.id } })"
          class="card p-3 cursor-pointer hover:border-primary-500 transition-colors"
        >
          <div class="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
            <img v-if="game.cover_url" :src="game.cover_url" :alt="game.name" class="w-full h-full object-cover" />
            <span v-else class="text-4xl">🎮</span>
          </div>
          <p class="text-sm font-medium text-white truncate">{{ game.name }}</p>
        </div>
      </div>
      <div v-else class="text-gray-500 text-center py-8">暂无收藏游戏</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

const authStore = useAuthStore()
const gameStore = useGameStore()
const favoriteGames = ref(gameStore.favoriteGames)

watch(() => gameStore.favoriteGames, (v) => { favoriteGames.value = v })

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  gameStore.fetchFavorites()
})
</script>
