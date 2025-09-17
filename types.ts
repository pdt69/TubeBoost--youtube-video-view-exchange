import type { Dispatch, SetStateAction } from 'react';

export interface User {
  id: string;
  displayName: string;
  points: number;
  totalPointsEarned: number;
  referralCode: string;
  referredBy: string | null;
  watchedVideoIds: string[];
  referredUserIds: string[];
}

export interface Video {
  id: string; // youtube video id
  submittedAt: number;
  isDefault: boolean; // admin-added
  views: number;
  title: string;
  description: string;
  duration: number; // in seconds
  submittedBy: string; // User ID
}

export interface PaymentOption {
  id: string;
  points: number;
  price: number;
  isSpecialOffer: boolean;
  payPalId?: string;
  clickBankId?: string;
}

export interface PurchaseCode {
    code: string;
    points: number;
    isRedeemed: boolean;
    redeemedBy: string | null;
}

export interface ReferralTier {
  id: string;
  referralCount: number;
  bonusPoints: number;
}

export interface AdminSettings {
  adminPass: string;
  pointsPerWatch: number;
  costPerSubmission: number; // cost to submit a video
  paymentOptions: PaymentOption[];
  referralPoints: number;
  watchDuration: number;
  referralTiers: ReferralTier[];
}

export type AppContextType = {
  videos: Video[];
  currentUser: User | null;
  allUsers: User[];
  settings: AdminSettings;
  isAdmin: boolean;
  currentVideo: Video | null;
  videoQueue: Video[];
  purchaseCodes: PurchaseCode[];
  videoProgress: number;
  addVideo: (url: string, description: string) => Promise<void>;
  updateVideo: (id: string, newTitle: string, newDescription: string, isDefault: boolean, newDuration: number) => void;
  deleteVideo: (id: string) => void;
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => boolean;
  addPointsToUser: (userId: string, amount: number) => void;
  login: (password: string) => boolean;
  logout: () => void;
  updateSettings: (newSettings: Partial<AdminSettings>) => void;
  incrementViewCount: (id: string) => void;
  selectNextVideo: () => void;
  isLoading: boolean;
  addPaymentOption: () => void;
  updatePaymentOption: (id: string, updatedOption: PaymentOption) => void;
  deletePaymentOption: (id: string) => void;
  generatePurchaseCode: (points: number) => PurchaseCode;
  redeemPurchaseCode: (code: string) => boolean;
  deletePurchaseCode: (code: string) => void;
  markVideoAsWatched: (videoId: string) => void;
  updateUserDisplayName: (newName: string) => void;
  // Fix: Correctly type `setVideoProgress` to allow functional updates.
  setVideoProgress: Dispatch<SetStateAction<number>>;
  isWatching: boolean;
  setIsWatching: Dispatch<SetStateAction<boolean>>;
};