import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiRecommendedProduct {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  basePrice: number;
  minPrice?: number;
  categoryName: string;
  brandName: string;
  reason: string;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatMessage[];
  budget?: number;
  category?: string;
}

export interface AiChatResponse {
  reply: string;
  recommendedProducts: AiRecommendedProduct[];
}

export const aiAssistantApi = {
  chat: async (request: AiChatRequest): Promise<ApiEnvelope<AiChatResponse>> => {
    const res = await apiClient.post<ApiEnvelope<AiChatResponse>>('/ai/chat', request);
    return res.data;
  },

  getPrompts: async (): Promise<ApiEnvelope<string[]>> => {
    const res = await apiClient.get<ApiEnvelope<string[]>>('/ai/prompts');
    return res.data;
  },
};

export default aiAssistantApi;
