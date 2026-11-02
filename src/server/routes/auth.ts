import { Router, Response } from 'express';
import { dbService, verifyPassword, generateToken } from '../db.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// User Registration
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const { user, token } = dbService.createUser({
      name,
      email,
      phone,
      password,
      referralCodeInput: referralCode,
    });

    return res.status(201).json({
      message: 'Account created successfully! ৳10 welcome bonus added.',
      user,
      token,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// User Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRecord = dbService.findUserByEmail(email);
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (userRecord.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact platform support.' });
    }

    const isValid = verifyPassword(password, userRecord.passwordHash, userRecord.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ id: userRecord.id, role: 'user', email: userRecord.email });
    const { passwordHash, salt, ...safeUser } = userRecord;

    return res.json({
      message: 'Login successful',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Dedicated Admin Login
router.post('/admin-login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Admin username and password are required.' });
    }

    const admin = dbService.findAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const isValid = verifyPassword(password, admin.passwordHash, admin.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    dbService.updateAdminLastLogin(admin.id);
    const token = generateToken({ id: admin.id, role: 'admin', username: admin.username });

    dbService.addAuditLog({
      actor: admin.username,
      actorRole: 'admin',
      action: 'ADMIN_LOGIN',
      details: 'Administrator logged in to SULTAN EARN backoffice console.',
      ipAddress: req.ip,
    });

    return res.json({
      message: 'Admin authentication verified',
      admin: {
        id: admin.id,
        username: admin.username,
        role: 'admin',
      },
      token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin authentication failed.' });
  }
});

// Current Authenticated Identity Check
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role === 'admin') {
      const admin = dbService.findAdminByUsername(req.user.username || 'Sultan');
      if (!admin) return res.status(404).json({ error: 'Admin not found.' });
      return res.json({
        role: 'admin',
        admin: {
          id: admin.id,
          username: admin.username,
          role: 'admin',
        },
      });
    }

    if (req.user?.id) {
      const user = dbService.findUserById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      return res.json({
        role: 'user',
        user,
      });
    }

    return res.status(401).json({ error: 'Unrecognized user session.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Forgot Password Flow
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Please enter your account email.' });

  const user = dbService.findUserByEmail(email);
  if (!user) {
    // Return friendly generic message for security
    return res.json({ message: 'If this email is registered, recovery instructions have been sent.' });
  }

  const recoveryPin = Math.floor(100000 + Math.random() * 900000).toString();
  return res.json({
    message: `A temporary password reset verification PIN (${recoveryPin}) has been generated. Use it to reset your credentials.`,
    demoRecoveryPin: recoveryPin,
  });
});

export default router;
