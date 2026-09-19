import { Router } from 'express';
import { dbService } from '../supabase.js';
import { fileDB } from '../db.js';

const router = Router();

// POST demo request
router.post('/demo-request', async (req, res) => {
  try {
    const { name, email, phone, organization, drone_interest, use_case, message } = req.body;

    if (!name || !email || !drone_interest) {
      res.status(400).json({ error: 'Name, email, and drone model interest are required' });
      return;
    }

    const saved = await dbService.saveDemoRequest({
      name,
      email,
      phone,
      organization,
      drone_interest,
      use_case,
      message
    });

    await dbService.logAudit({
      user_email: email,
      role: 'guest',
      action: 'DEMO_REQUEST_SUBMITTED',
      resource: `${drone_interest} by ${organization || name}`,
      ip_address: req.ip || '127.0.0.1',
      severity: 'INFO'
    });

    res.status(201).json({ 
      message: 'Thank you! Your flight demo inquiry has been registered with IndoWings flight engineers.',
      request: saved 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit demo request' });
  }
});

// POST general contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    const saved = await dbService.saveDemoRequest({
      name,
      email,
      drone_interest: subject || 'General Corporate Inquiry',
      message
    });

    res.status(201).json({ message: 'Message received. IndoWings team will respond shortly.', data: saved });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST feedback
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, rating, category, message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Feedback message is required' });
      return;
    }

    const savedFb = fileDB.saveFeedback({
      id: `FB-${Date.now().toString().slice(-6)}`,
      user_name: name || 'Anonymous',
      user_email: email || 'anonymous@indowings.com',
      drone_name: req.body?.drone_name || 'Cyberone UAV Platform',
      rating: Number(rating) || 5,
      category: category || 'General',
      message: message.trim(),
      created_at: new Date().toISOString(),
      verified_order: false,
      status: 'published'
    });

    res.status(201).json({ 
      success: true,
      message: 'Thank you! Your feedback has been recorded and submitted to the IndoWings engineering team.',
      feedback: savedFb 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

export default router;
