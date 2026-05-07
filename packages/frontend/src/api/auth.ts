import apiClient from './client'
import type { ApiResponse, AuthTokens, User, RegisterRequest, LoginRequest } from '@emu-matrix/shared'

export const authApi = {
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  async login(data: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  async refresh(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    return response.data
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
