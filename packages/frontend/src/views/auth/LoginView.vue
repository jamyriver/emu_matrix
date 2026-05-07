<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="card p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-primary-400 mb-8">登录</h1>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名 / 邮箱</label>
          <input
            v-model="username"
            type="text"
            class="input-field"
            placeholder="请输入用户名或邮箱"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            class="input-field"
            placeholder="请输入密码"
            required
          />
        </div>
        <div v-if="error" class="text-red-400 text-sm text-center">{{ error }}</div>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="mt-6 text-center text-gray-400 text-sm">
        还没有账号？
        <router-link to="/register" class="text-primary-400 hover:text-primary-300">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } else {
      error.value = '用户名或密码错误'
    }
  } catch {
    error.value = '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
