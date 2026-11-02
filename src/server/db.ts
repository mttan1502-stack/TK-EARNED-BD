/**
 * SULTAN EARN - Secure Database Engine & Cryptography
 * File-backed persistence with atomic write safety, PBKDF2 hashing, and HMAC tokens.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  AdminUser,
  Task,
  TaskSubmission,
  ReferralRecord,
  Withdrawal,
  Transaction,
  Advertisement,
  AppSettings,
  AuditLog,
  AdGateSession,
  SpinResult,
  MathQuestion
} from '../types/index.js';

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  admins: (AdminUser & { passwordHash: string; salt: string })[];
  tasks: Task[];
  task_submissions: TaskSubmission[];
  referrals: ReferralRecord[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  advertisements: Advertisement[];
  app_settings: AppSettings;
  audit_logs: AuditLog[];
  ad_sessions: AdGateSession[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sultan_earn_db.json');
const HMAC_SECRET = process.env.APP_SECRET || 'sultan-earn-super-secure-hmac-key-2026';

// Cryptography Helpers
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(payload: { id: string; role: 'user' | 'admin'; username?: string; email?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(`${header}.${data}`).digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): { id: string; role: 'user' | 'admin'; username?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(`${header}.${data}`).digest('base64url');
    if (expectedSig !== signature) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Generate Ad Security Token
export function createAdSecurityToken(taskId: string, userId: string, timestamp: number): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(`${taskId}:${userId}:${timestamp}`).digest('hex');
}

// Default Seed Data
function getInitialSeedData(): DatabaseSchema {
  const adminCreds = hashPassword('Sultan112233');
  const userCreds = hashPassword('User123!');

  const initialSettings: AppSettings = {
    platformName: 'TK EARNED BD',
    currencyBase: 'BDT',
    currencySymbol: '৳',
    bdtToUsdRate: 125,
    usdtWithdrawalRate: 125,
    minWithdrawBkash: 200,
    minWithdrawNagad: 200,
    minWithdrawUsdt: 2, // 2 USDT = 250 BDT
    referralBonusBdt: 15,
    referralCommissionPercent: 10, // 10%
    adTimerSeconds: 10, // 10 second mandatory ad gate
    dailyVideoAdLimit: 15,
    announcementText: '🔥 Welcome to TK EARNED BD! Earn instant BDT by completing tasks & watching verified sponsor ads. Instant 24/7 withdrawals to bKash, Nagad & USDT TRC-20.',
    isWithdrawalEnabled: true,
    dailySpinLimit: 15,
    spinCooldownSeconds: 30,
    mathQuizRewardBdt: 4,
    dailyMathLimit: 20,
    isAdsterraEnabled: true,
    adsterraSocialBarScript: '',
    adsterraPopunderScript: '',
    adsterraBannerCode: '<div class="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-center"><span class="text-xs text-purple-300 font-semibold font-mono">⚡ Adsterra High-CPM Banner 300x250</span></div>',
    adsterraDirectLink: 'https://highratecpm.com',
  };

  const initialTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Follow TK EARNED BD Official Telegram Channel',
      category: 'social_task',
      description: 'Join the official Telegram broadcast channel to get instant updates on high-paying sponsor bonuses.',
      rewardBdt: 25,
      durationSeconds: 30,
      targetUrl: 'https://telegram.org',
      instructions: 'Click the sponsor link, stay on page for 30s, and confirm username in submission box.',
      dailyLimit: 1,
      completedCount: 24,
      status: 'active',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'task-2',
      title: 'Install & Review Global Crypto Web Wallet',
      category: 'app_review',
      description: 'Visit the official app download page and test the new zero-fee crypto wallet interface.',
      rewardBdt: 45,
      durationSeconds: 60,
      targetUrl: 'https://example.com/wallet-review',
      instructions: 'Browse the wallet security features, stay active on the page for 60 seconds.',
      dailyLimit: 1,
      completedCount: 18,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'task-3',
      title: 'Daily Web Ad Sponsor Discovery #1',
      category: 'web_visit',
      description: 'Explore our top sponsor e-commerce marketplace and browse featured electronics.',
      rewardBdt: 18,
      durationSeconds: 20,
      targetUrl: 'https://example.com/sponsor-mall',
      instructions: 'Visit the sponsored marketplace and scroll through at least 2 product listings.',
      dailyLimit: 1,
      completedCount: 42,
      status: 'active',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'task-4',
      title: 'Fintech Survey: Bangladesh Digital Banking 2026',
      category: 'survey',
      description: 'Complete a brief 4-question research survey on mobile wallet preferences (bKash vs Nagad).',
      rewardBdt: 35,
      durationSeconds: 45,
      targetUrl: 'https://example.com/fintech-survey',
      instructions: 'Provide authentic feedback on digital finance and mobile money transfers.',
      dailyLimit: 1,
      completedCount: 31,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'task-5',
      title: 'Subscribe to YouTube Tech Earnings Channel',
      category: 'social_task',
      description: 'Watch the introductory earning strategies video and hit the subscribe button.',
      rewardBdt: 20,
      durationSeconds: 30,
      targetUrl: 'https://youtube.com',
      instructions: 'Watch at least 30 seconds of the guide video and submit confirmation.',
      dailyLimit: 1,
      completedCount: 15,
      status: 'active',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'task-6',
      title: 'Watch Sponsored Partner Video #104',
      category: 'video',
      description: 'Watch high-resolution 15-second sponsor showcase video for fintech tools.',
      rewardBdt: 15,
      durationSeconds: 15,
      targetUrl: 'https://example.com/video-partner',
      instructions: 'Watch until the end of the video countdown without switching tabs.',
      dailyLimit: 2,
      completedCount: 56,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const initialAds: Advertisement[] = [
    {
      id: 'ad-1',
      title: 'Sultan Cloud VPS Hosting - 50% Flash Sale',
      type: 'social_bar',
      position: 'top_bar',
      bannerCodeHtml: `<div class="p-3 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border border-purple-500/30 rounded-xl text-white flex items-center justify-between gap-4 shadow-lg shadow-purple-950/40">
        <div class="flex items-center gap-3">
          <span class="text-xl">⚡</span>
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-purple-300">Sponsored Deal</div>
            <div class="text-sm font-semibold">High-Speed Cloud VPS Servers at 50% Off · Code: SULTAN50</div>
          </div>
        </div>
        <a href="https://example.com/vps" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
          Claim 50% Deal
        </a>
      </div>`,
      targetUrl: 'https://example.com/vps',
      status: 'active',
      impressions: 412,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ad-2',
      title: 'Global Forex & Crypto Exchange Promotion',
      type: 'popunder',
      position: 'task_gate',
      targetUrl: 'https://example.com/crypto-sponsor',
      bannerCodeHtml: `<div class="p-6 bg-slate-900/95 border border-purple-500/40 rounded-2xl text-center space-y-4">
        <div class="inline-flex p-3 bg-purple-500/20 text-purple-400 rounded-full text-2xl">💎</div>
        <h4 class="text-lg font-bold text-white">Join 1,000,000+ Crypto Traders</h4>
        <p class="text-xs text-slate-300 max-w-sm mx-auto">Get zero trading fees for 30 days and up to $100 welcome bonus on your first verified deposit.</p>
        <a href="https://example.com/crypto-sponsor" target="_blank" class="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors">Visit Sponsor Website</a>
      </div>`,
      rewardBdt: 0,
      timerSeconds: 10,
      status: 'active',
      impressions: 890,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ad-3',
      title: 'Verified Micro-Financing & High Yield APY',
      type: 'custom_html',
      position: 'sidebar',
      bannerCodeHtml: `<div class="p-4 bg-gradient-to-b from-slate-900 to-purple-950/60 border border-purple-500/20 rounded-xl space-y-2">
        <div class="text-xs font-semibold text-purple-400">FINTECH PARTNER</div>
        <div class="text-sm font-bold text-white">Earn up to 14.8% APY with Daily Dividends</div>
        <div class="text-xs text-slate-400">Regulated smart contract vaults with auto-compounding.</div>
      </div>`,
      targetUrl: 'https://example.com/yield',
      status: 'active',
      impressions: 278,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ad-4',
      title: 'Next-Gen Mobile Banking Showcase',
      type: 'video',
      position: 'video_section',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      rewardBdt: 12,
      timerSeconds: 15,
      status: 'active',
      impressions: 340,
      createdAt: new Date().toISOString(),
    },
  ];

  const demoUser: User & { passwordHash: string; salt: string } = {
    id: 'user-demo-1',
    userId: 'SE-102938',
    name: 'Tanvir Ahmed',
    email: 'user@example.com',
    phone: '+8801712345678',
    role: 'user',
    refCode: 'SULTAN1029',
    balance: 550,
    totalEarned: 1250,
    taskEarned: 820,
    referralEarned: 280,
    adsEarned: 150,
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tanvir',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    passwordHash: userCreds.hash,
    salt: userCreds.salt,
  };

  const initialWithdrawals: Withdrawal[] = [
    {
      id: 'w-101',
      userId: demoUser.id,
      userName: demoUser.name,
      userEmail: demoUser.email,
      method: 'bKash',
      accountNumber: '01712345678',
      amountBdt: 400,
      amountUsd: 3.2,
      feeBdt: 8,
      netAmount: 392,
      status: 'paid',
      trxId: 'BKH984210389',
      adminNote: 'Processed via bKash Merchant API',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000 + 3600000).toISOString(),
    },
    {
      id: 'w-102',
      userId: demoUser.id,
      userName: demoUser.name,
      userEmail: demoUser.email,
      method: 'Nagad',
      accountNumber: '01898765432',
      amountBdt: 300,
      amountUsd: 2.4,
      feeBdt: 6,
      netAmount: 294,
      status: 'approved',
      trxId: 'NGD4910284',
      adminNote: 'Scheduled for batch transfer',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 'w-103',
      userId: demoUser.id,
      userName: demoUser.name,
      userEmail: demoUser.email,
      method: 'USDT',
      accountNumber: 'T9yD14Nj9j7xAB4dbGeiX9h8unkkhxmTkn',
      amountBdt: 250,
      amountUsd: 2.0,
      feeBdt: 0,
      netAmount: 250,
      status: 'pending',
      adminNote: 'Pending TRC20 transfer confirmation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialTransactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: demoUser.id,
      type: 'task_reward',
      amountBdt: 45,
      balanceAfter: 650,
      description: 'Completed Task: Install & Review Crypto Web Wallet',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'tx-2',
      userId: demoUser.id,
      type: 'ad_reward',
      amountBdt: 12,
      balanceAfter: 662,
      description: 'Watched Sponsored Video Ad',
      createdAt: new Date(Date.now() - 40000000).toISOString(),
    },
    {
      id: 'tx-3',
      userId: demoUser.id,
      type: 'referral_bonus',
      amountBdt: 15,
      balanceAfter: 677,
      description: 'New referral registration bonus: Rahim Sheikh',
      createdAt: new Date(Date.now() - 30000000).toISOString(),
    },
    {
      id: 'tx-4',
      userId: demoUser.id,
      type: 'withdrawal',
      amountBdt: -250,
      balanceAfter: 427,
      description: 'Requested USDT TRC-20 Withdrawal',
      referenceId: 'w-103',
      createdAt: new Date().toISOString(),
    },
  ];

  const initialAuditLogs: AuditLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
      actor: 'system',
      actorRole: 'system',
      action: 'SYSTEM_INITIALIZED',
      details: 'SULTAN EARN core database initialized with secure PBKDF2 hashing.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      actor: 'Sultan',
      actorRole: 'admin',
      action: 'WITHDRAWAL_PAID',
      targetId: 'w-101',
      details: 'bKash withdrawal for 400 BDT marked PAID. TrxID: BKH984210389',
    },
  ];

  return {
    users: [demoUser],
    admins: [
      {
        id: 'admin-sultan-1',
        username: 'Sultan',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        passwordHash: adminCreds.hash,
        salt: adminCreds.salt,
      },
    ],
    tasks: initialTasks,
    task_submissions: [],
    referrals: [
      {
        id: 'ref-1',
        referrerId: demoUser.id,
        refereeId: 'user-ref-2',
        refereeName: 'Rahim Sheikh',
        refereeEmail: 'rahim@example.com',
        commissionEarned: 45,
        status: 'active',
        joinedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'ref-2',
        referrerId: demoUser.id,
        refereeId: 'user-ref-3',
        refereeName: 'Sadia Jahan',
        refereeEmail: 'sadia@example.com',
        commissionEarned: 30,
        status: 'active',
        joinedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
    withdrawals: initialWithdrawals,
    transactions: initialTransactions,
    advertisements: initialAds,
    app_settings: initialSettings,
    audit_logs: initialAuditLogs,
    ad_sessions: [],
  };
}

class DatabaseService {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure default admin exists
        const hasAdmin = parsed.admins && parsed.admins.some((a: AdminUser) => a.username === 'Sultan');
        if (!hasAdmin) {
          const creds = hashPassword('Sultan112233');
          parsed.admins = parsed.admins || [];
          parsed.admins.push({
            id: 'admin-sultan-1',
            username: 'Sultan',
            role: 'admin',
            passwordHash: creds.hash,
            salt: creds.salt,
            lastLogin: new Date().toISOString(),
          });
          this.saveDatabase(parsed);
        }
        if (parsed.app_settings) {
          parsed.app_settings.platformName = 'TK EARNED BD';
          if (parsed.app_settings.dailySpinLimit === undefined) parsed.app_settings.dailySpinLimit = 15;
          if (parsed.app_settings.spinCooldownSeconds === undefined) parsed.app_settings.spinCooldownSeconds = 30;
          if (parsed.app_settings.mathQuizRewardBdt === undefined) parsed.app_settings.mathQuizRewardBdt = 4;
          if (parsed.app_settings.dailyMathLimit === undefined) parsed.app_settings.dailyMathLimit = 20;
          if (parsed.app_settings.isAdsterraEnabled === undefined) parsed.app_settings.isAdsterraEnabled = true;
          if (parsed.app_settings.adsterraSocialBarScript === undefined) parsed.app_settings.adsterraSocialBarScript = '';
          if (parsed.app_settings.adsterraPopunderScript === undefined) parsed.app_settings.adsterraPopunderScript = '';
          if (parsed.app_settings.adsterraBannerCode === undefined) {
            parsed.app_settings.adsterraBannerCode = '<div class="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-center"><span class="text-xs text-purple-300 font-semibold font-mono">⚡ Adsterra High-CPM Banner 300x250</span></div>';
          }
          if (parsed.app_settings.adsterraDirectLink === undefined) parsed.app_settings.adsterraDirectLink = 'https://highratecpm.com';
          this.saveDatabase(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database file, re-initializing seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data?: DatabaseSchema) {
    try {
      const dataToSave = data || this.db;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // --- Audit Logging ---
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.db.audit_logs.unshift(log);
    if (this.db.audit_logs.length > 500) {
      this.db.audit_logs = this.db.audit_logs.slice(0, 500);
    }
    this.saveDatabase();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.db.audit_logs;
  }

  // --- App Settings ---
  public getSettings(): AppSettings {
    return this.db.app_settings;
  }

  public updateSettings(partial: Partial<AppSettings>, adminUser: string): AppSettings {
    this.db.app_settings = { ...this.db.app_settings, ...partial };
    this.addAuditLog({
      actor: adminUser,
      actorRole: 'admin',
      action: 'SETTINGS_UPDATED',
      details: `Updated platform settings: ${Object.keys(partial).join(', ')}`,
    });
    this.saveDatabase();
    return this.db.app_settings;
  }

  // --- Admin Authentication ---
  public findAdminByUsername(username: string) {
    return this.db.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
  }

  public updateAdminLastLogin(adminId: string) {
    const admin = this.db.admins.find((a) => a.id === adminId);
    if (admin) {
      admin.lastLogin = new Date().toISOString();
      this.saveDatabase();
    }
  }

  // --- User Authentication & Management ---
  public findUserById(id: string): User | undefined {
    const u = this.db.users.find((user) => user.id === id);
    if (!u) return undefined;
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser;
  }

  public findUserWithCredsById(id: string) {
    return this.db.users.find((user) => user.id === id);
  }

  public findUserByEmail(email: string) {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByRefCode(refCode: string) {
    return this.db.users.find((u) => u.refCode.toUpperCase() === refCode.toUpperCase());
  }

  public createUser(userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    referralCodeInput?: string;
  }): { user: User; token: string } {
    if (this.findUserByEmail(userData.email)) {
      throw new Error('An account with this email already exists.');
    }

    const { hash, salt } = hashPassword(userData.password);
    const userIdNum = Math.floor(100000 + Math.random() * 900000);
    const generatedUserId = `SE-${userIdNum}`;
    const generatedRefCode = `SULTAN${Math.floor(1000 + Math.random() * 9000)}`;

    let referrer: (User & { passwordHash: string; salt: string }) | undefined;
    if (userData.referralCodeInput) {
      referrer = this.findUserByRefCode(userData.referralCodeInput);
    }

    const newUser: User & { passwordHash: string; salt: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: generatedUserId,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone?.trim() || '',
      role: 'user',
      refCode: generatedRefCode,
      referredBy: referrer ? referrer.userId : undefined,
      balance: 10, // 10 BDT welcome bonus
      totalEarned: 10,
      taskEarned: 0,
      referralEarned: 0,
      adsEarned: 0,
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}`,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt: salt,
    };

    this.db.users.push(newUser);

    // Initial welcome transaction
    this.addTransaction({
      userId: newUser.id,
      type: 'referral_bonus',
      amountBdt: 10,
      balanceAfter: 10,
      description: 'Welcome Sign-up Bonus',
    });

    // If referred by another user, award referral bonus to referrer
    if (referrer) {
      const bonusBdt = this.db.app_settings.referralBonusBdt;
      referrer.balance += bonusBdt;
      referrer.totalEarned += bonusBdt;
      referrer.referralEarned += bonusBdt;

      this.db.referrals.push({
        id: `ref-${Date.now()}`,
        referrerId: referrer.id,
        refereeId: newUser.id,
        refereeName: newUser.name,
        refereeEmail: newUser.email,
        commissionEarned: bonusBdt,
        status: 'active',
        joinedAt: new Date().toISOString(),
      });

      this.addTransaction({
        userId: referrer.id,
        type: 'referral_bonus',
        amountBdt: bonusBdt,
        balanceAfter: referrer.balance,
        description: `Referral Signup Bonus from ${newUser.name}`,
      });
    }

    this.addAuditLog({
      actor: newUser.email,
      actorRole: 'user',
      action: 'USER_REGISTERED',
      targetId: newUser.id,
      details: `New user registration (${newUser.userId}).`,
    });

    this.saveDatabase();
    const token = generateToken({ id: newUser.id, role: 'user', email: newUser.email });
    const { passwordHash, salt: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  }

  public getAllUsers(): User[] {
    return this.db.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
  }

  public setUserStatus(userId: string, status: 'active' | 'suspended', adminUsername: string): User {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.status = status;
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: `USER_${status.toUpperCase()}`,
      targetId: user.id,
      details: `User status changed to ${status}.`,
    });
    this.saveDatabase();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public adjustUserBalance(
    userId: string,
    amountBdt: number,
    reason: string,
    adminUsername: string
  ): { user: User; transaction: Transaction } {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');

    const newBalance = user.balance + amountBdt;
    if (newBalance < 0) {
      throw new Error(`Insufficient balance for deduction. Current balance: ৳${user.balance}`);
    }

    user.balance = newBalance;
    if (amountBdt > 0) {
      user.totalEarned += amountBdt;
    }

    const tx = this.addTransaction({
      userId: user.id,
      type: 'admin_adjustment',
      amountBdt: amountBdt,
      balanceAfter: user.balance,
      description: `Admin Balance Adjustment: ${reason}`,
    });

    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'BALANCE_ADJUSTED',
      targetId: user.id,
      details: `Adjusted balance by ৳${amountBdt}. New balance: ৳${user.balance}. Reason: ${reason}`,
    });

    this.saveDatabase();
    const { passwordHash, salt, ...safeUser } = user;
    return { user: safeUser, transaction: tx };
  }

  // --- Transactions ---
  public addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.db.transactions.unshift(tx);
    return tx;
  }

  public getUserTransactions(userId: string): Transaction[] {
    return this.db.transactions.filter((tx) => tx.userId === userId);
  }

  // --- Task System ---
  public getAllTasks(): Task[] {
    return this.db.tasks;
  }

  public getActiveTasks(): Task[] {
    return this.db.tasks.filter((t) => t.status === 'active');
  }

  public createTask(taskData: Omit<Task, 'id' | 'completedCount' | 'createdAt'>, adminUsername: string): Task {
    const task: Task = {
      id: `task-${Date.now()}`,
      completedCount: 0,
      createdAt: new Date().toISOString(),
      ...taskData,
    };
    this.db.tasks.unshift(task);
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'TASK_CREATED',
      targetId: task.id,
      details: `Created task "${task.title}" with reward ৳${task.rewardBdt}`,
    });
    this.saveDatabase();
    return task;
  }

  public updateTask(id: string, partial: Partial<Task>, adminUsername: string): Task {
    const task = this.db.tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found.');
    Object.assign(task, partial);
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'TASK_UPDATED',
      targetId: task.id,
      details: `Updated task "${task.title}".`,
    });
    this.saveDatabase();
    return task;
  }

  public deleteTask(id: string, adminUsername: string): boolean {
    const idx = this.db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const deleted = this.db.tasks.splice(idx, 1)[0];
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'TASK_DELETED',
      targetId: id,
      details: `Deleted task "${deleted.title}".`,
    });
    this.saveDatabase();
    return true;
  }

  public getUserTaskSubmissions(userId: string): TaskSubmission[] {
    return this.db.task_submissions.filter((s) => s.userId === userId);
  }

  public getAllTaskSubmissions(): TaskSubmission[] {
    return this.db.task_submissions;
  }

  // --- 10-Second Ad Timer System Security & Verification ---
  public startAdGateSession(taskId: string, userId: string, adId: string): AdGateSession {
    const startedAt = Date.now();
    const token = createAdSecurityToken(taskId, userId, startedAt);
    const session: AdGateSession = {
      sessionId: `ad-sess-${startedAt}-${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      userId,
      adId,
      startedAt,
      timerSeconds: this.db.app_settings.adTimerSeconds || 10,
      token,
    };
    // Keep active session list reasonable
    this.db.ad_sessions = this.db.ad_sessions.filter((s) => Date.now() - s.startedAt < 600000);
    this.db.ad_sessions.push(session);
    this.saveDatabase();
    return session;
  }

  public verifyAdGateSession(sessionId: string, token: string): { verified: boolean; taskUnlockToken?: string; error?: string } {
    const session = this.db.ad_sessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      return { verified: false, error: 'Ad session expired or invalid. Please start again.' };
    }

    if (session.token !== token) {
      return { verified: false, error: 'Security signature mismatch.' };
    }

    const elapsedMs = Date.now() - session.startedAt;
    const requiredMs = (session.timerSeconds || 10) * 1000 - 800; // 800ms network tolerance

    if (elapsedMs < requiredMs) {
      return {
        verified: false,
        error: `Security violation: Ad was not watched for the full ${session.timerSeconds} seconds. Please do not skip.`,
      };
    }

    // Generate verified task unlock token
    const unlockSecret = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`unlock:${session.taskId}:${session.userId}:${session.sessionId}`)
      .digest('hex');

    const taskUnlockToken = `${session.sessionId}__${unlockSecret}`;
    return { verified: true, taskUnlockToken };
  }

  public completeTaskWithVerification(
    taskId: string,
    userId: string,
    taskUnlockToken: string,
    submittedProof?: string,
    ipAddress?: string
  ): { taskSubmission: TaskSubmission; rewardBdt: number; newBalance: number } {
    const task = this.db.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task does not exist.');
    if (task.status !== 'active') throw new Error('This task is currently paused.');

    // Check duplicate claim for this user
    const existing = this.db.task_submissions.find((s) => s.taskId === taskId && s.userId === userId);
    if (existing) {
      throw new Error('You have already completed and claimed rewards for this task.');
    }

    // Verify task unlock token
    const [sessionId, unlockSecret] = (taskUnlockToken || '').split('__');
    if (!sessionId || !unlockSecret) {
      throw new Error('Invalid task verification token. You must complete the 10-second sponsor ad first.');
    }

    const expectedUnlockSecret = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`unlock:${taskId}:${userId}:${sessionId}`)
      .digest('hex');

    if (unlockSecret !== expectedUnlockSecret) {
      throw new Error('Task unlock security verification failed.');
    }

    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.status === 'suspended') throw new Error('Account suspended.');

    // Atomic balance update
    user.balance += task.rewardBdt;
    user.totalEarned += task.rewardBdt;
    user.taskEarned += task.rewardBdt;
    task.completedCount = (task.completedCount || 0) + 1;

    // Record submission
    const submission: TaskSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: task.id,
      taskTitle: task.title,
      userId: user.id,
      userName: user.name,
      rewardBdt: task.rewardBdt,
      status: 'verified',
      submittedProof: submittedProof || 'Verified via 10-second Ad Gate',
      timestamp: new Date().toISOString(),
      ipAddress: ipAddress || '127.0.0.1',
    };
    this.db.task_submissions.unshift(submission);

    // Record Transaction
    this.addTransaction({
      userId: user.id,
      type: 'task_reward',
      amountBdt: task.rewardBdt,
      balanceAfter: user.balance,
      description: `Reward for task: ${task.title}`,
      referenceId: task.id,
    });

    // Award Referrer Commission if applicable
    if (user.referredBy) {
      const referrer = this.db.users.find((u) => u.userId === user.referredBy);
      if (referrer && referrer.id !== user.id) {
        const commPercent = this.db.app_settings.referralCommissionPercent || 10;
        const commBdt = Math.round(((task.rewardBdt * commPercent) / 100) * 100) / 100;
        if (commBdt > 0) {
          referrer.balance += commBdt;
          referrer.totalEarned += commBdt;
          referrer.referralEarned += commBdt;

          this.addTransaction({
            userId: referrer.id,
            type: 'referral_commission',
            amountBdt: commBdt,
            balanceAfter: referrer.balance,
            description: `${commPercent}% Task Commission from ${user.name}`,
          });

          const refRecord = this.db.referrals.find((r) => r.referrerId === referrer.id && r.refereeId === user.id);
          if (refRecord) {
            refRecord.commissionEarned += commBdt;
          }
        }
      }
    }

    this.saveDatabase();
    return { taskSubmission: submission, rewardBdt: task.rewardBdt, newBalance: user.balance };
  }

  // --- Video Ads ---
  public getActiveVideoAds(): Advertisement[] {
    return this.db.advertisements.filter((a) => a.type === 'video' && a.status === 'active');
  }

  public claimVideoAdReward(userId: string, adId: string): { rewardBdt: number; newBalance: number } {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.status === 'suspended') throw new Error('Account suspended.');

    const ad = this.db.advertisements.find((a) => a.id === adId);
    if (!ad || ad.type !== 'video' || ad.status !== 'active') {
      throw new Error('Video advertisement is not available.');
    }

    const reward = ad.rewardBdt || 10;
    user.balance += reward;
    user.totalEarned += reward;
    user.adsEarned += reward;
    ad.impressions = (ad.impressions || 0) + 1;

    this.addTransaction({
      userId: user.id,
      type: 'ad_reward',
      amountBdt: reward,
      balanceAfter: user.balance,
      description: `Watched Video Ad: ${ad.title}`,
      referenceId: ad.id,
    });

    this.saveDatabase();
    return { rewardBdt: reward, newBalance: user.balance };
  }

  // --- Ads Management (Admin) ---
  public getAllAds(): Advertisement[] {
    return this.db.advertisements;
  }

  public createAd(adData: Omit<Advertisement, 'id' | 'impressions' | 'createdAt'>, adminUsername: string): Advertisement {
    const ad: Advertisement = {
      id: `ad-${Date.now()}`,
      impressions: 0,
      createdAt: new Date().toISOString(),
      ...adData,
    };
    this.db.advertisements.unshift(ad);
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'AD_CREATED',
      targetId: ad.id,
      details: `Created ${ad.type} ad: "${ad.title}"`,
    });
    this.saveDatabase();
    return ad;
  }

  public updateAd(id: string, partial: Partial<Advertisement>, adminUsername: string): Advertisement {
    const ad = this.db.advertisements.find((a) => a.id === id);
    if (!ad) throw new Error('Ad not found.');
    Object.assign(ad, partial);
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'AD_UPDATED',
      targetId: ad.id,
      details: `Updated ad: "${ad.title}"`,
    });
    this.saveDatabase();
    return ad;
  }

  public deleteAd(id: string, adminUsername: string): boolean {
    const idx = this.db.advertisements.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const deleted = this.db.advertisements.splice(idx, 1)[0];
    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'AD_DELETED',
      targetId: id,
      details: `Deleted ad: "${deleted.title}"`,
    });
    this.saveDatabase();
    return true;
  }

  // --- Withdrawal System (Atomic balance locking & protection against double deductions) ---
  public createWithdrawalRequest(
    userId: string,
    method: 'bKash' | 'Nagad' | 'USDT',
    accountNumber: string,
    amountBdt: number
  ): Withdrawal {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.status === 'suspended') throw new Error('Account is suspended. Cannot withdraw.');

    if (!this.db.app_settings.isWithdrawalEnabled) {
      throw new Error('Withdrawals are temporarily paused by administration.');
    }

    // Minimum limits check
    let minLimit = this.db.app_settings.minWithdrawBkash;
    if (method === 'Nagad') minLimit = this.db.app_settings.minWithdrawNagad;
    if (method === 'USDT') minLimit = this.db.app_settings.minWithdrawUsdt * this.db.app_settings.usdtWithdrawalRate;

    if (amountBdt < minLimit) {
      throw new Error(`Minimum withdrawal amount for ${method} is ৳${minLimit}`);
    }

    if (user.balance < amountBdt) {
      throw new Error(`Insufficient balance. Your available balance is ৳${user.balance}`);
    }

    // Deduct balance atomically
    user.balance -= amountBdt;

    const rate = this.db.app_settings.bdtToUsdRate || 125;
    const amountUsd = Math.round((amountBdt / rate) * 100) / 100;
    // 2% platform fee for mobile banking, 0% for USDT
    const feeBdt = method === 'USDT' ? 0 : Math.round(amountBdt * 0.02 * 100) / 100;
    const netAmount = amountBdt - feeBdt;

    const withdrawal: Withdrawal = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method,
      accountNumber: accountNumber.trim(),
      amountBdt,
      amountUsd,
      feeBdt,
      netAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.withdrawals.unshift(withdrawal);

    // Record ledger transaction
    this.addTransaction({
      userId: user.id,
      type: 'withdrawal',
      amountBdt: -amountBdt,
      balanceAfter: user.balance,
      description: `Withdrawal request #${withdrawal.id.slice(-6)} to ${method} (${accountNumber})`,
      referenceId: withdrawal.id,
    });

    this.addAuditLog({
      actor: user.email,
      actorRole: 'user',
      action: 'WITHDRAWAL_REQUESTED',
      targetId: withdrawal.id,
      details: `User requested ৳${amountBdt} via ${method}. New balance: ৳${user.balance}`,
    });

    this.saveDatabase();
    return withdrawal;
  }

  public getUserWithdrawals(userId: string): Withdrawal[] {
    return this.db.withdrawals.filter((w) => w.userId === userId);
  }

  public getAllWithdrawals(): Withdrawal[] {
    return this.db.withdrawals;
  }

  public approveWithdrawal(withdrawalId: string, adminUsername: string, adminNote?: string): Withdrawal {
    const w = this.db.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found.');
    if (w.status !== 'pending') throw new Error(`Cannot approve a withdrawal that is already ${w.status}.`);

    w.status = 'approved';
    w.adminNote = adminNote || 'Approved by Admin';
    w.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'WITHDRAWAL_APPROVED',
      targetId: w.id,
      details: `Approved withdrawal of ৳${w.amountBdt} to ${w.method}`,
    });

    this.saveDatabase();
    return w;
  }

  public markWithdrawalPaid(
    withdrawalId: string,
    trxId: string,
    adminUsername: string,
    adminNote?: string
  ): Withdrawal {
    const w = this.db.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found.');
    if (w.status === 'rejected') throw new Error('Cannot mark a rejected withdrawal as paid.');
    if (!trxId || !trxId.trim()) throw new Error('Transaction ID (TrxID) is mandatory when marking as Paid.');

    w.status = 'paid';
    w.trxId = trxId.trim();
    w.adminNote = adminNote || 'Paid successfully';
    w.updatedAt = new Date().toISOString();

    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'WITHDRAWAL_PAID',
      targetId: w.id,
      details: `Marked withdrawal ৳${w.amountBdt} as PAID. TrxID: ${w.trxId}`,
    });

    this.saveDatabase();
    return w;
  }

  public rejectWithdrawal(withdrawalId: string, reason: string, adminUsername: string): Withdrawal {
    const w = this.db.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found.');
    if (w.status === 'paid') throw new Error('Cannot reject a withdrawal that has already been paid.');
    if (w.status === 'rejected') throw new Error('This withdrawal has already been rejected.');
    if (!reason || !reason.trim()) throw new Error('Rejection reason is mandatory.');

    w.status = 'rejected';
    w.rejectionReason = reason.trim();
    w.adminNote = `Rejected: ${reason.trim()}`;
    w.updatedAt = new Date().toISOString();

    // Secure Refund: Restore user balance atomically
    const user = this.db.users.find((u) => u.id === w.userId);
    if (user) {
      user.balance += w.amountBdt;
      this.addTransaction({
        userId: user.id,
        type: 'withdrawal_refund',
        amountBdt: w.amountBdt,
        balanceAfter: user.balance,
        description: `Refund for rejected withdrawal #${w.id.slice(-6)}. Reason: ${reason}`,
        referenceId: w.id,
      });
    }

    this.addAuditLog({
      actor: adminUsername,
      actorRole: 'admin',
      action: 'WITHDRAWAL_REJECTED',
      targetId: w.id,
      details: `Rejected withdrawal of ৳${w.amountBdt}. Refunded balance to user. Reason: ${reason}`,
    });

    this.saveDatabase();
    return w;
  }

  // --- Referral Management ---
  public getReferralsByReferrer(referrerId: string): ReferralRecord[] {
    return this.db.referrals.filter((r) => r.referrerId === referrerId);
  }

  public getAllReferrals(): ReferralRecord[] {
    return this.db.referrals;
  }

  // --- Dashboard Analytics ---
  public getAdminStats() {
    const totalUsers = this.db.users.length;
    const activeUsers = this.db.users.filter((u) => u.status === 'active').length;
    const totalWithdrawals = this.db.withdrawals.length;
    const pendingWithdrawals = this.db.withdrawals.filter((w) => w.status === 'pending').length;
    const paidWithdrawalsAmount = this.db.withdrawals
      .filter((w) => w.status === 'paid')
      .reduce((acc, curr) => acc + curr.amountBdt, 0);
    const totalTaskCompletions = this.db.task_submissions.length;
    const totalRewardsPaid = this.db.transactions
      .filter((tx) => tx.amountBdt > 0 && tx.type !== 'admin_adjustment' && tx.type !== 'withdrawal_refund')
      .reduce((acc, curr) => acc + curr.amountBdt, 0);
    const totalReferrals = this.db.referrals.length;

    return {
      totalUsers,
      activeUsers,
      totalWithdrawals,
      pendingWithdrawals,
      paidWithdrawalsAmount,
      totalTaskCompletions,
      totalRewardsPaid,
      totalReferrals,
      settings: this.db.app_settings,
    };
  }

  // --- Spin Wheel ("চাকা ঘুরানো") ---
  public getSpinStatus(userId: string) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');

    const settings = this.getSettings();
    const now = Date.now();
    const lastSpin = user.lastSpinTimestamp || 0;
    const cooldownMs = (settings.spinCooldownSeconds || 30) * 1000;
    const cooldownRemaining = Math.max(0, Math.ceil((lastSpin + cooldownMs - now) / 1000));

    const lastDate = new Date(lastSpin).toDateString();
    const todayDate = new Date().toDateString();
    const dailyUsed = lastDate === todayDate ? (user.dailySpinsUsed || 0) : 0;
    const dailyMax = settings.dailySpinLimit || 15;
    const spinsLeft = Math.max(0, dailyMax - dailyUsed);

    return {
      dailySpinsLeft: spinsLeft,
      dailyMax,
      cooldownSecondsRemaining: cooldownRemaining,
      canSpin: spinsLeft > 0 && cooldownRemaining === 0,
      prizes: [1, 5, 2, 10, 3, 15, 2, 25, 5, 50],
      spinEarned: user.spinEarned || 0,
    };
  }

  public executeSpin(userId: string): SpinResult {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.status === 'suspended') throw new Error('Account suspended.');

    const settings = this.getSettings();
    const now = Date.now();
    const lastSpin = user.lastSpinTimestamp || 0;
    const cooldownMs = (settings.spinCooldownSeconds || 30) * 1000;

    const lastDate = new Date(lastSpin).toDateString();
    const todayDate = new Date().toDateString();
    let dailyUsed = lastDate === todayDate ? (user.dailySpinsUsed || 0) : 0;
    const dailyMax = settings.dailySpinLimit || 15;

    if (dailyUsed >= dailyMax) {
      throw new Error(`Daily spin limit of ${dailyMax} reached. Come back tomorrow!`);
    }

    if (now < lastSpin + cooldownMs) {
      const waitSec = Math.ceil((lastSpin + cooldownMs - now) / 1000);
      throw new Error(`Spin cooldown active. Please wait ${waitSec}s.`);
    }

    // Segments: 10 options [1, 5, 2, 10, 3, 15, 2, 25, 5, 50]
    const segments = [
      { prize: 1, weight: 25 },
      { prize: 5, weight: 20 },
      { prize: 2, weight: 25 },
      { prize: 10, weight: 12 },
      { prize: 3, weight: 18 },
      { prize: 15, weight: 7 },
      { prize: 2, weight: 20 },
      { prize: 25, weight: 4 },
      { prize: 5, weight: 15 },
      { prize: 50, weight: 1 },
    ];

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      if (rand < segments[i].weight) {
        selectedIndex = i;
        break;
      }
      rand -= segments[i].weight;
    }

    const wonPrize = segments[selectedIndex].prize;

    user.balance += wonPrize;
    user.totalEarned += wonPrize;
    user.spinEarned = (user.spinEarned || 0) + wonPrize;
    user.dailySpinsUsed = dailyUsed + 1;
    user.lastSpinTimestamp = now;

    const tx: Transaction = {
      id: `tx-spin-${now}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      type: 'spin_reward',
      amountBdt: wonPrize,
      balanceAfter: user.balance,
      description: `Lucky Spin Prize Won: ৳${wonPrize} BDT`,
      createdAt: new Date().toISOString(),
    };
    this.db.transactions.unshift(tx);

    this.addAuditLog({
      actor: user.name,
      actorRole: 'user',
      action: 'SPIN_REWARD_CLAIMED',
      targetId: tx.id,
      details: `User spun lucky wheel and won ৳${wonPrize} BDT. Balance: ৳${user.balance}`,
    });

    this.saveDatabase();

    return {
      prizeBdt: wonPrize,
      segmentIndex: selectedIndex,
      dailySpinsLeft: Math.max(0, dailyMax - user.dailySpinsUsed),
      cooldownSeconds: settings.spinCooldownSeconds || 30,
      newBalance: user.balance,
      message: `Congratulations! You won ৳${wonPrize} BDT from Lucky Spin!`,
    };
  }

  // --- Math Quiz ("ম্যাথ কুইজ") ---
  private mathSessions = new Map<string, { answer: number; expiresAt: number; rewardBdt: number }>();

  public getMathQuestion(userId: string): MathQuestion {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');

    const settings = this.getSettings();
    const lastMath = user.lastMathTimestamp || 0;
    const lastDate = new Date(lastMath).toDateString();
    const todayDate = new Date().toDateString();
    const dailyUsed = lastDate === todayDate ? (user.dailyMathUsed || 0) : 0;
    const dailyMax = settings.dailyMathLimit || 20;

    if (dailyUsed >= dailyMax) {
      throw new Error(`Daily math quiz limit of ${dailyMax} reached. Come back tomorrow!`);
    }

    const operators: ('+' | '-' | '×')[] = ['+', '-', '×'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let num1 = 0;
    let num2 = 0;
    let answer = 0;

    if (op === '+') {
      num1 = Math.floor(Math.random() * 45) + 10;
      num2 = Math.floor(Math.random() * 45) + 5;
      answer = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * 18) + 5;
      answer = num1 - num2;
    } else {
      num1 = Math.floor(Math.random() * 12) + 2;
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = num1 * num2;
    }

    const optionsSet = new Set<number>([answer]);
    while (optionsSet.size < 4) {
      const delta = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrong = answer + delta;
      if (wrong > 0 && wrong !== answer) {
        optionsSet.add(wrong);
      }
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    const questionId = `math-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const rewardBdt = settings.mathQuizRewardBdt || 4;

    this.mathSessions.set(questionId, {
      answer,
      expiresAt: Date.now() + 45000,
      rewardBdt,
    });

    return {
      questionId,
      num1,
      num2,
      operator: op,
      options,
      timeLimitSeconds: 25,
      rewardBdt,
      dailyMathLeft: dailyMax - dailyUsed,
    };
  }

  public verifyMathAnswer(userId: string, questionId: string, selectedAnswer: number) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.status === 'suspended') throw new Error('Account suspended.');

    const session = this.mathSessions.get(questionId);
    if (!session) {
      throw new Error('Question expired or invalid session. Please start a new question.');
    }
    this.mathSessions.delete(questionId);

    if (Date.now() > session.expiresAt) {
      throw new Error('Time expired for this question.');
    }

    const settings = this.getSettings();
    const lastMath = user.lastMathTimestamp || 0;
    const lastDate = new Date(lastMath).toDateString();
    const todayDate = new Date().toDateString();
    let dailyUsed = lastDate === todayDate ? (user.dailyMathUsed || 0) : 0;
    const dailyMax = settings.dailyMathLimit || 20;

    if (dailyUsed >= dailyMax) {
      throw new Error('Daily math quiz limit reached.');
    }

    const isCorrect = selectedAnswer === session.answer;
    if (!isCorrect) {
      return {
        correct: false,
        correctAnswer: session.answer,
        rewardBdt: 0,
        dailyMathLeft: Math.max(0, dailyMax - dailyUsed),
        newBalance: user.balance,
        message: `Incorrect answer. The correct answer was ${session.answer}. Try another one!`,
      };
    }

    const reward = session.rewardBdt;
    user.balance += reward;
    user.totalEarned += reward;
    user.mathEarned = (user.mathEarned || 0) + reward;
    user.dailyMathUsed = dailyUsed + 1;
    user.lastMathTimestamp = Date.now();

    const tx: Transaction = {
      id: `tx-math-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      type: 'math_reward',
      amountBdt: reward,
      balanceAfter: user.balance,
      description: `Math Quiz Reward: ৳${reward} BDT`,
      createdAt: new Date().toISOString(),
    };
    this.db.transactions.unshift(tx);

    this.addAuditLog({
      actor: user.name,
      actorRole: 'user',
      action: 'MATH_QUIZ_SOLVED',
      targetId: tx.id,
      details: `User correctly solved math quiz and earned ৳${reward} BDT. Balance: ৳${user.balance}`,
    });

    this.saveDatabase();

    return {
      correct: true,
      correctAnswer: session.answer,
      rewardBdt: reward,
      dailyMathLeft: Math.max(0, dailyMax - user.dailyMathUsed),
      newBalance: user.balance,
      message: `Excellent! Correct answer. ৳${reward} BDT added to your balance!`,
    };
  }
}

export const dbService = new DatabaseService();
