import apiClient from './client'
import type { ApiResponse, CloudScreenshot, CloudRecording, PaginatedResponse } from '@emu-matrix/shared'

export const mediaApi = {
  async uploadScreenshot(formData: FormData): Promise<ApiResponse<CloudScreenshot>> {
    const response = await apiClient.post('/screenshots', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getScreenshots(params?: { platform?: string; page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<CloudScreenshot>>> {
    const response = await apiClient.get('/screenshots', { params })
    return response.data
  },

  async getScreenshot(id: string): Promise<ApiResponse<CloudScreenshot>> {
    const response = await apiClient.get(`/screenshots/${id}`)
    return response.data
  },

  async deleteScreenshot(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/screenshots/${id}`)
    return response.data
  },

  async uploadRecording(formData: FormData): Promise<ApiResponse<CloudRecording>> {
    const response = await apiClient.post('/recordings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },

  async getRecordings(params?: { platform?: string; page?: number; pageSize?: number }): Promise<ApiResponse<PaginatedResponse<CloudRecording>>> {
    const response = await apiClient.get('/recordings', { params })
    return response.data
  },

  async getRecording(id: string): Promise<ApiResponse<CloudRecording>> {
    const response = await apiClient.get(`/recordings/${id}`)
    return response.data
  },

  async deleteRecording(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/recordings/${id}`)
    return response.data
  },
}
