<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-8">
            <router-link to="/" class="flex items-center space-x-2">
              <span class="text-2xl font-bold text-primary-400">EMU_Matrix</span>
            </router-link>
            <div class="hidden md:flex items-center space-x-4">
              <router-link to="/" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                游戏大厅
              </router-link>
              <router-link v-if="authStore.isAuthenticated" to="/saves" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                云存档
              </router-link>
              <router-link v-if="authStore.isAuthenticated" to="/screenshots" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                云截图
              </router-link>
              <router-link v-if="authStore.isAuthenticated" to="/recordings" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                云录像
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <span class="text-gray-300 text-sm">{{ authStore.user?.username }}</span>
              <router-link to="/profile" class="btn-secondary text-sm">个人中心</router-link>
              <button @click="handleLogout" class="btn-danger text-sm">退出</button>
            </template>
            <template v-else>
              <router-link to="/login" class="btn-primary text-sm">登录</router-link>
              <router-link to="/register" class="btn-secondary text-sm">注册</router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>
    <main class="flex-1">
      <router-view />
    </main>
    <footer class="bg-gray-800 border-t border-gray-700 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        EMU_Matrix 云游戏平台 &copy; 2024 | 支持 FC / MD / SFC / GB / GBA 五大经典平台
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.accessToken && !authStore.user) {
    await authStore.fetchUser()
  }
})

async function handleLogout() {
  await authStore.logout()
}
</script>
