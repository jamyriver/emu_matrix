import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Game, Platform, PaginatedResponse } from '@emu-matrix/shared'
import { gamesApi } from '@/api/games'

export const useGameStore = defineStore('game', () => {
  const games = ref<Game[]>([])
  const currentGame = ref<Game | null>(null)
  const recentGames = ref<Game[]>([])
  const favoriteGames = ref<Game[]>([])
  const pagination = ref<Omit<PaginatedResponse<Game>, 'items'>>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  const loading = ref(false)
  const currentPlatform = ref<Platform | ''>('')

  async function fetchGames(params?: { page?: number; pageSize?: number; platform?: Platform; category?: string; search?: string }): Promise<void> {
    loading.value = true
    try {
      const response = await gamesApi.getGames(params)
      if (response.success && response.data) {
        games.value = response.data.items
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

  async function fetchGame(id: string): Promise<void> {
    loading.value = true
    try {
      const response = await gamesApi.getGame(id)
      if (response.success && response.data) {
        currentGame.value = response.data
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchRecentGames(): Promise<void> {
    try {
      const response = await gamesApi.getRecentGames()
      if (response.success && response.data) {
        recentGames.value = response.data
      }
    } catch {}
  }

  async function fetchFavorites(): Promise<void> {
    try {
      const response = await gamesApi.getFavorites()
      if (response.success && response.data) {
        favoriteGames.value = response.data
      }
    } catch {}
  }

  async function toggleFavorite(gameId: string): Promise<void> {
    const isFav = favoriteGames.value.some((g) => g.id === gameId)
    if (isFav) {
      await gamesApi.removeFavorite(gameId)
      favoriteGames.value = favoriteGames.value.filter((g) => g.id !== gameId)
    } else {
      await gamesApi.addFavorite(gameId)
      await fetchFavorites()
    }
  }

  function isFavorite(gameId: string): boolean {
    return favoriteGames.value.some((g) => g.id === gameId)
  }

  return {
    games,
    currentGame,
    recentGames,
    favoriteGames,
    pagination,
    loading,
    currentPlatform,
    fetchGames,
    fetchGame,
    fetchRecentGames,
    fetchFavorites,
    toggleFavorite,
    isFavorite,
  }
})
