import { Router, Response } from 'express';
import { dbService } from '../db.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

import { Request } from 'express';
import { verifyToken } from '../db.js';

// 1. Public Settings & Platform Notices (Instant live sync for everyone)
router.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = dbService.getSettings();
    return res.json({ settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Publicly Browsable Tasks (with completion markers if authenticated)
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.id;
    }

    const allActiveTasks = dbService.getActiveTasks();
    const userSubmissions = userId ? dbService.getUserTaskSubmissions(userId) : [];
    const completedTaskIds = new Set(userSubmissions.map((s) => s.taskId));

    const tasksWithState = allActiveTasks.map((t) => ({
      ...t,
      isCompletedByUser: completedTaskIds.has(t.id),
    }));

    return res.json({ tasks: tasksWithState });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Public Video Ads List
router.get('/video-ads', (req: Request, res: Response) => {
  try {
    const videoAds = dbService.getActiveVideoAds();
    const settings = dbService.getSettings();
    return res.json({
      videoAds,
      dailyLimit: settings.dailyVideoAdLimit,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// All following routes require verified authentication
router.use(authMiddleware);

// Step 1 of 10-Second Ad Timer: Start Ad Gate Session
router.post('/tasks/start-ad', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'Task ID is required.' });

    // Pick active ad for this task gate
    const ads = dbService.getAllAds().filter((a) => a.status === 'active');
    const sponsorAd = ads.find((a) => a.position === 'task_gate') || ads[0];

    const session = dbService.startAdGateSession(taskId, req.user!.id, sponsorAd?.id || 'default');

    return res.json({
      sessionId: session.sessionId,
      timerSeconds: session.timerSeconds,
      token: session.token,
      sponsorAd,
      serverTimestamp: session.startedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Step 2 of 10-Second Ad Timer: Verify 10-Second Ad Completion
router.post('/tasks/verify-ad', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, token } = req.body;
    if (!sessionId || !token) {
      return res.status(400).json({ error: 'Session ID and verification token are required.' });
    }

    const result = dbService.verifyAdGateSession(sessionId, token);
    if (!result.verified) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      verified: true,
      taskUnlockToken: result.taskUnlockToken,
      message: 'Sponsor ad verified successfully! Task is now unlocked.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Step 3 of Task System: Submit Completed Task
router.post('/tasks/complete', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId, taskUnlockToken, submittedProof } = req.body;
    if (!taskId || !taskUnlockToken) {
      return res.status(400).json({ error: 'Task ID and valid taskUnlockToken are required.' });
    }

    const result = dbService.completeTaskWithVerification(
      taskId,
      req.user!.id,
      taskUnlockToken,
      submittedProof,
      req.ip
    );

    return res.json({
      success: true,
      message: `🎉 Task completed! ৳${result.rewardBdt} has been credited to your balance.`,
      rewardBdt: result.rewardBdt,
      newBalance: result.newBalance,
      submission: result.taskSubmission,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Task submission failed.' });
  }
});

// Video Ads
router.get('/video-ads', (req: AuthenticatedRequest, res: Response) => {
  try {
    const videoAds = dbService.getActiveVideoAds();
    const settings = dbService.getSettings();
    return res.json({
      videoAds,
      dailyLimit: settings.dailyVideoAdLimit,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/video-ads/claim', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { adId } = req.body;
    if (!adId) return res.status(400).json({ error: 'Ad ID is required.' });

    const result = dbService.claimVideoAdReward(req.user!.id, adId);
    return res.json({
      success: true,
      message: `🎉 Reward claimed! ৳${result.rewardBdt} added to your account.`,
      rewardBdt: result.rewardBdt,
      newBalance: result.newBalance,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Referral Center
router.get('/referrals', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = dbService.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const referrals = dbService.getReferralsByReferrer(user.id);
    const settings = dbService.getSettings();

    return res.json({
      refCode: user.refCode,
      referrals,
      totalReferrals: referrals.length,
      referralEarningsBdt: user.referralEarned,
      commissionPercent: settings.referralCommissionPercent,
      signupBonusBdt: settings.referralBonusBdt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Withdrawal Operations
router.post('/withdraw', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { method, accountNumber, amountBdt } = req.body;
    if (!method || !accountNumber || !amountBdt) {
      return res.status(400).json({ error: 'Method, account number, and amount are required.' });
    }

    if (!['bKash', 'Nagad', 'USDT'].includes(method)) {
      return res.status(400).json({ error: 'Invalid withdrawal method selected.' });
    }

    const parsedAmount = parseFloat(amountBdt);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
    }

    const withdrawal = dbService.createWithdrawalRequest(
      req.user!.id,
      method as 'bKash' | 'Nagad' | 'USDT',
      accountNumber,
      parsedAmount
    );

    return res.status(201).json({
      message: 'Withdrawal request submitted successfully! It is pending admin verification.',
      withdrawal,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/withdrawals', (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = dbService.getUserWithdrawals(req.user!.id);
    return res.json({ withdrawals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = dbService.getUserTransactions(req.user!.id);
    return res.json({ transactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Spin Wheel Endpoints ---
router.get('/spin/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = dbService.getSpinStatus(req.user!.id);
    return res.json(status);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/spin/execute', (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = dbService.executeSpin(req.user!.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- Math Quiz Endpoints ---
router.get('/math/question', (req: AuthenticatedRequest, res: Response) => {
  try {
    const question = dbService.getMathQuestion(req.user!.id);
    return res.json(question);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/math/verify', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({ error: 'Question ID and selected answer are required.' });
    }
    const result = dbService.verifyMathAnswer(req.user!.id, questionId, Number(selectedAnswer));
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
