/**
 * SULTAN EARN - Core TypeScript Interfaces
 */

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  userId: string; // e.g. SE-849201
  name: string;
  email: string;
  phone?: string;
  role: 'user';
  refCode: string; // e.g. SULTAN8492
  referredBy?: string; // referrer userId
  balance: number; // in BDT
  totalEarned: number; // in BDT
  taskEarned: number;
  referralEarned: number;
  adsEarned: number;
  spinEarned?: number;
  mathEarned?: number;
  dailySpinsUsed?: number;
  lastSpinTimestamp?: number;
  dailyMathUsed?: number;
  lastMathTimestamp?: number;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
  lastLogin?: string;
}

export type TaskCategory = 'all' | 'web_visit' | 'survey' | 'app_review' | 'social_task' | 'video';

export interface Task {
  id: string;
  title: string;
  category: 'web_visit' | 'survey' | 'app_review' | 'social_task' | 'video';
  description: string;
  rewardBdt: number;
  durationSeconds: number;
  targetUrl: string;
  instructions: string;
  dailyLimit: number;
  completedCount: number;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  rewardBdt: number;
  status: 'verified' | 'rejected';
  submittedProof?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  commissionEarned: number;
  status: 'active' | 'pending';
  joinedAt: string;
}

export type WithdrawalMethod = 'bKash' | 'Nagad' | 'USDT';
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  method: WithdrawalMethod;
  accountNumber: string; // Phone number or TRC20/BEP20 USDT address
  amountBdt: number;
  amountUsd: number;
  feeBdt: number;
  netAmount: number;
  status: WithdrawalStatus;
  trxId?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'task_reward'
  | 'ad_reward'
  | 'referral_bonus'
  | 'referral_commission'
  | 'withdrawal'
  | 'withdrawal_refund'
  | 'admin_adjustment'
  | 'spin_reward'
  | 'math_reward';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountBdt: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export type AdType =
  | 'social_bar'
  | 'popunder'
  | 'custom_html'
  | 'video'
  | 'adsterra_social'
  | 'adsterra_popunder'
  | 'adsterra_banner'
  | 'adsterra_direct';

export interface Advertisement {
  id: string;
  title: string;
  type: AdType;
  position: 'top_bar' | 'task_gate' | 'sidebar' | 'video_section' | 'spin_wheel' | 'math_quiz';
  bannerCodeHtml?: string;
  targetUrl?: string;
  videoUrl?: string;
  rewardBdt?: number;
  timerSeconds?: number;
  status: 'active' | 'inactive';
  impressions?: number;
  adNetwork?: 'custom' | 'adsterra';
  adsterraKey?: string;
  createdAt: string;
}

export interface AppSettings {
  platformName: string;
  currencyBase: string;
  currencySymbol: string;
  bdtToUsdRate: number; // e.g. 125 (1 USD = 125 BDT)
  usdtWithdrawalRate: number; // e.g. 125
  minWithdrawBkash: number; // e.g. 200 BDT
  minWithdrawNagad: number; // e.g. 200 BDT
  minWithdrawUsdt: number; // e.g. 2 USDT (250 BDT)
  referralBonusBdt: number; // e.g. 15 BDT
  referralCommissionPercent: number; // e.g. 10%
  adTimerSeconds: number; // e.g. 10 seconds mandatory ad gate
  dailyVideoAdLimit: number; // e.g. 15
  announcementText: string;
  isWithdrawalEnabled: boolean;
  // Spin Wheel & Math Quiz Settings
  dailySpinLimit: number; // e.g. 15
  spinCooldownSeconds: number; // e.g. 30 seconds
  mathQuizRewardBdt: number; // e.g. 4 BDT per solved quiz
  dailyMathLimit: number; // e.g. 20 quizzes per day
  // Adsterra Ads Configuration
  isAdsterraEnabled: boolean;
  adsterraSocialBarScript?: string;
  adsterraPopunderScript?: string;
  adsterraBannerCode?: string;
  adsterraDirectLink?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string; // admin username or user id
  actorRole: 'admin' | 'user' | 'system';
  action: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
}

export interface AdGateSession {
  sessionId: string;
  taskId: string;
  userId: string;
  adId: string;
  startedAt: number;
  timerSeconds: number;
  token: string;
}

export interface SpinResult {
  prizeBdt: number;
  segmentIndex: number;
  dailySpinsLeft: number;
  cooldownSeconds: number;
  newBalance: number;
  message: string;
}

export interface MathQuestion {
  questionId: string;
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  options: number[];
  timeLimitSeconds: number;
  rewardBdt: number;
  dailyMathLeft: number;
}

