import apiClient from './client'
import type { ApiResponse, CloudSave, CreateSaveRequest, PaginatedResponse } from '@emu-matrix/shared'

export const savesApi = {
  async getAllSaves(): Promise<ApiResponse<CloudSave[]>> {
    const response = await apiClient.get('/saves')
    return response.data
  },

  async getGameSaves(gameId: string, platform?: string): Promise<ApiResponse<CloudSave[]>> {
    const response = await apiClient.get(`/saves/${gameId}`, { params: { platform } })
    return response.data
  },

  async getSaveData(gameId: string, platform: string, slotId: number): Promise<ApiResponse<CloudSave>> {
    const response = await apiClient.get(`/saves/${gameId}/${platform}/${slotId}`)
    return response.data
  },

  async createSave(data: CreateSaveRequest): Promise<ApiResponse<CloudSave>> {
    const response = await apiClient.post('/saves', data)
    return response.data
  },

  async deleteSave(saveId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/saves/${saveId}`)
    return response.data
  },
}
