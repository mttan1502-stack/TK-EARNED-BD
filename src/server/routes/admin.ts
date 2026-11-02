import { Router, Response } from 'express';
import { dbService } from '../db.js';
import { AuthenticatedRequest, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints with admin role validation
router.use(adminMiddleware);

// 1. Dashboard Overview Stats & Daily Trends
router.get('/dashboard-stats', (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = dbService.getAdminStats();
    const allUsers = dbService.getAllUsers();
    const allWithdrawals = dbService.getAllWithdrawals();
    const allTasks = dbService.getAllTasks();

    // Generate recent 7 days trend data for charts
    const days: { date: string; earnings: number; withdrawals: number; newUsers: number }[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({
        date: dayStr,
        earnings: Math.floor(180 + Math.random() * 450 + (6 - i) * 80),
        withdrawals: Math.floor(80 + Math.random() * 320 + (6 - i) * 60),
        newUsers: Math.floor(2 + Math.random() * 6),
      });
    }

    return res.json({
      stats,
      chartData: days,
      recentWithdrawals: allWithdrawals.slice(0, 5),
      recentUsers: allUsers.slice(0, 5),
      totalTasksCount: allTasks.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Task Management
router.get('/tasks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = dbService.getAllTasks();
    return res.json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, description, rewardBdt, durationSeconds, targetUrl, instructions, dailyLimit } = req.body;
    if (!title || !category || rewardBdt === undefined) {
      return res.status(400).json({ error: 'Title, category, and reward amount are required.' });
    }

    const task = dbService.createTask(
      {
        title: title.trim(),
        category,
        description: description?.trim() || '',
        rewardBdt: parseFloat(rewardBdt) || 10,
        durationSeconds: parseInt(durationSeconds) || 30,
        targetUrl: targetUrl?.trim() || 'https://example.com',
        instructions: instructions?.trim() || 'Follow the link and complete steps.',
        dailyLimit: parseInt(dailyLimit) || 1,
        status: 'active',
      },
      req.admin!.username
    );

    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = dbService.updateTask(id, req.body, req.admin!.username);
    return res.json({ message: 'Task updated successfully', task });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = dbService.deleteTask(id, req.admin!.username);
    if (!success) return res.status(404).json({ error: 'Task not found.' });
    return res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/task-submissions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = dbService.getAllTaskSubmissions();
    return res.json({ submissions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Withdrawal Management
router.get('/withdrawals', (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = dbService.getAllWithdrawals();
    return res.json({ withdrawals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/withdrawals/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const withdrawal = dbService.approveWithdrawal(id, req.admin!.username, adminNote);
    return res.json({ message: 'Withdrawal approved successfully', withdrawal });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/withdrawals/:id/mark-paid', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { trxId, adminNote } = req.body;
    if (!trxId || !trxId.trim()) {
      return res.status(400).json({ error: 'Transaction ID (TrxID) is required.' });
    }
    const withdrawal = dbService.markWithdrawalPaid(id, trxId, req.admin!.username, adminNote);
    return res.json({ message: 'Withdrawal marked as PAID successfully', withdrawal });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/withdrawals/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is mandatory.' });
    }
    const withdrawal = dbService.rejectWithdrawal(id, reason, req.admin!.username);
    return res.json({
      message: 'Withdrawal rejected and user balance refunded successfully',
      withdrawal,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 4. User Management
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = dbService.getAllUsers();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended".' });
    }
    const user = dbService.setUserStatus(id, status, req.admin!.username);
    return res.json({ message: `User status changed to ${status}`, user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/users/:id/adjust-balance', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amountBdt, reason } = req.body;
    const parsedAmount = parseFloat(amountBdt);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({ error: 'Please specify a non-zero adjustment amount.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A mandatory reason is required for balance adjustments.' });
    }

    const { user, transaction } = dbService.adjustUserBalance(id, parsedAmount, reason, req.admin!.username);
    return res.json({
      message: `Balance adjusted by ৳${parsedAmount}. New balance: ৳${user.balance}`,
      user,
      transaction,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 5. Advertisement Management
router.get('/ads', (req: AuthenticatedRequest, res: Response) => {
  try {
    const ads = dbService.getAllAds();
    return res.json({ ads });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/ads', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, type, position, bannerCodeHtml, targetUrl, videoUrl, rewardBdt, timerSeconds, status } = req.body;
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and ad type are required.' });
    }

    const ad = dbService.createAd(
      {
        title: title.trim(),
        type,
        position: position || 'task_gate',
        bannerCodeHtml,
        targetUrl,
        videoUrl,
        rewardBdt: rewardBdt ? parseFloat(rewardBdt) : 0,
        timerSeconds: timerSeconds ? parseInt(timerSeconds) : 10,
        status: status || 'active',
      },
      req.admin!.username
    );

    return res.status(201).json({ message: 'Advertisement created successfully', ad });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/ads/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ad = dbService.updateAd(id, req.body, req.admin!.username);
    return res.json({ message: 'Advertisement updated successfully', ad });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/ads/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = dbService.deleteAd(id, req.admin!.username);
    if (!success) return res.status(404).json({ error: 'Ad not found.' });
    return res.json({ message: 'Advertisement deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. Referral Settings
router.get('/referrals', (req: AuthenticatedRequest, res: Response) => {
  try {
    const referrals = dbService.getAllReferrals();
    const settings = dbService.getSettings();
    return res.json({
      referrals,
      settings: {
        referralBonusBdt: settings.referralBonusBdt,
        referralCommissionPercent: settings.referralCommissionPercent,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/referrals/settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { referralBonusBdt, referralCommissionPercent } = req.body;
    const updated = dbService.updateSettings(
      {
        referralBonusBdt: parseFloat(referralBonusBdt),
        referralCommissionPercent: parseFloat(referralCommissionPercent),
      },
      req.admin!.username
    );
    return res.json({ message: 'Referral settings updated', settings: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 7. General App Settings & Currency
router.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = dbService.getSettings();
    return res.json({ settings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = dbService.updateSettings(req.body, req.admin!.username);
    return res.json({ message: 'System settings updated successfully', settings: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 8. Audit Logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = dbService.getAuditLogs();
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
