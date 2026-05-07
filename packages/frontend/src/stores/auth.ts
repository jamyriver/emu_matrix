import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthTokens } from '@emu-matrix/shared'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const response = await authApi.login({ username, password })
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data
        user.value = userData
        accessToken.value = tokens.accessToken
        refreshToken.value = tokens.refreshToken
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function register(username: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await authApi.register({ username, email, password })
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data
        user.value = userData
        accessToken.value = tokens.accessToken
        refreshToken.value = tokens.refreshToken
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function fetchUser(): Promise<void> {
    try {
      const response = await authApi.getMe()
      if (response.success && response.data) {
        user.value = response.data
      }
    } catch {
      logout()
    }
  }

  async function refreshTokens(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      const response = await authApi.refresh(refreshToken.value)
      if (response.success && response.data) {
        accessToken.value = response.data.accessToken
        refreshToken.value = response.data.refreshToken
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  function logout(): void {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    register,
    fetchUser,
    refreshTokens,
    logout,
  }
})
