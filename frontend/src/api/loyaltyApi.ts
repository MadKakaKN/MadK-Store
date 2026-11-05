import apiClient from './apiClient';
import { ApiEnvelope } from '../types/auth';

export interface LoyaltyAccountDto {
  userId: string;
  currentBalance: number;
  lifetimePoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | string;
  totalSpent: number;
  pointsValueVnd: number;
  earnRatePercent: number;
  nextTier?: string | null;
  spentNeededForNextTier?: number | null;
}

export interface LoyaltyTransactionDto {
  id: string;
  orderId?: string | null;
  orderNumber?: string | null;
  points: number;
  balanceAfter: number;
  type: 'Earned' | 'Redeemed' | 'Refunded' | 'Adjusted' | string;
  description: string;
  createdAt: string;
}

export interface LoyaltyHistoryResponseDto {
  items: LoyaltyTransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface RedeemPointsEstimateResponseDto {
  pointsToRedeem: number;
  discountAmount: number;
  maximumRedeemablePoints: number;
  pointsBalance: number;
  isValid: boolean;
  errorMessage?: string | null;
}

export const loyaltyApi = {
  getAccount: async (): Promise<ApiEnvelope<LoyaltyAccountDto>> => {
    const res = await apiClient.get<ApiEnvelope<LoyaltyAccountDto>>('/loyalty/account');
    return res.data;
  },

  getHistory: async (page = 1, pageSize = 10): Promise<ApiEnvelope<LoyaltyHistoryResponseDto>> => {
    const res = await apiClient.get<ApiEnvelope<LoyaltyHistoryResponseDto>>('/loyalty/history', {
      params: { page, pageSize },
    });
    return res.data;
  },

  estimateRedeem: async (
    subtotalAmount: number,
    pointsToRedeem: number
  ): Promise<ApiEnvelope<RedeemPointsEstimateResponseDto>> => {
    const res = await apiClient.post<ApiEnvelope<RedeemPointsEstimateResponseDto>>(
      '/loyalty/estimate-redeem',
      { subtotalAmount, pointsToRedeem }
    );
    return res.data;
  },

  // Admin APIs
  getUserAccount: async (userId: string): Promise<ApiEnvelope<LoyaltyAccountDto>> => {
    const res = await apiClient.get<ApiEnvelope<LoyaltyAccountDto>>(
      `/admin/loyalty/users/${userId}/account`
    );
    return res.data;
  },

  getUserHistory: async (
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<ApiEnvelope<LoyaltyHistoryResponseDto>> => {
    const res = await apiClient.get<ApiEnvelope<LoyaltyHistoryResponseDto>>(
      `/admin/loyalty/users/${userId}/history`,
      { params: { page, pageSize } }
    );
    return res.data;
  },

  adjustPoints: async (request: {
    userId: string;
    points: number;
    reason: string;
  }): Promise<ApiEnvelope<LoyaltyAccountDto>> => {
    const res = await apiClient.post<ApiEnvelope<LoyaltyAccountDto>>(
      '/admin/loyalty/adjust',
      request
    );
    return res.data;
  },
};

export default loyaltyApi;
