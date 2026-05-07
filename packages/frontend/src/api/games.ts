import apiClient from './client'
import type { ApiResponse, Game, PaginatedResponse, GameListQuery, Platform, PlatformControlMapping } from '@emu-matrix/shared'

export interface RomInfo {
  romUrl: string
  name: string
  platform: Platform
  core: string
  system: string
  resolution: { width: number; height: number }
  controls: PlatformControlMapping
}

export interface PlatformInfo {
  id: Platform
  label: string
  core: string
  system: string
  resolution: { width: number; height: number }
  targetFps: number
  controls: PlatformControlMapping
  romExtensions: string[]
}

export const gamesApi = {
  async getGames(params?: GameListQuery): Promise<ApiResponse<PaginatedResponse<Game>>> {
    const response = await apiClient.get('/games', { params })
    return response.data
  },

  async getGame(id: string): Promise<ApiResponse<Game>> {
    const response = await apiClient.get(`/games/${id}`)
    return response.data
  },

  async getRomUrl(id: string): Promise<ApiResponse<RomInfo>> {
    const response = await apiClient.get(`/games/${id}/rom`)
    return response.data
  },

  async getPlatforms(): Promise<ApiResponse<PlatformInfo[]>> {
    const response = await apiClient.get('/games/platforms')
    return response.data
  },

  async getRecentGames(): Promise<ApiResponse<Game[]>> {
    const response = await apiClient.get('/games/recent')
    return response.data
  },

  async getFavorites(): Promise<ApiResponse<Game[]>> {
    const response = await apiClient.get('/games/favorites')
    return response.data
  },

  async addFavorite(gameId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/games/${gameId}/favorite`)
    return response.data
  },

  async removeFavorite(gameId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/games/${gameId}/favorite`)
    return response.data
  },
}
