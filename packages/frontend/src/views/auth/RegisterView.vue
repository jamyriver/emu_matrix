<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
    <div class="card p-8 w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-primary-400 mb-8">注册</h1>
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
          <input
            v-model="username"
            type="text"
            class="input-field"
            placeholder="3-50个字符，支持字母数字下划线"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="input-field"
            placeholder="请输入邮箱地址"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            class="input-field"
            placeholder="至少6个字符"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="input-field"
            placeholder="请再次输入密码"
            required
          />
        </div>
        <div v-if="error" class="text-red-400 text-sm text-center">{{ error }}</div>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      <p class="mt-6 text-center text-gray-400 text-sm">
        已有账号？
        <router-link to="/login" class="text-primary-400 hover:text-primary-300">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (password.value.length < 6) {
    error.value = '密码至少6个字符'
    return
  }

  loading.value = true
  try {
    const success = await authStore.register(username.value, email.value, password.value)
    if (success) {
      router.push('/')
    } else {
      error.value = '注册失败，用户名或邮箱可能已存在'
    }
  } catch {
    error.value = '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
