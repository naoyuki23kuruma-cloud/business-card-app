import axios from 'axios'
import type { Card, CardInput, CardsResponse, UploadResponse } from '../types/card'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const cardsApi = {
  list: (params?: { q?: string; tag?: string; favorite?: boolean; page?: number; limit?: number }) =>
    apiClient
      .get<CardsResponse>('/cards', {
        params: { ...params, favorite: params?.favorite ? 'true' : undefined },
      })
      .then((r) => r.data),

  get: (id: string) => apiClient.get<Card>(`/cards/${id}`).then((r) => r.data),

  create: (data: CardInput) => apiClient.post<Card>('/cards', data).then((r) => r.data),

  update: (id: string, data: CardInput) =>
    apiClient.put<Card>(`/cards/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/cards/${id}`),
}

export const uploadApi = {
  // Vercel Blob へ直接ストリーム送信
  uploadImage: async (file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> => {
    const res = await apiClient.post<UploadResponse>('/upload', file, {
      headers: {
        'Content-Type': file.type,
        'x-filename': encodeURIComponent(file.name),
      },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
    return res.data
  },
}
