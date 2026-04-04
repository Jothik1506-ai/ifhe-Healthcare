const express = require('express');
const router = express.Router();
const { logUserAction } = require('../utils/logger');

// POST /api/logs - Create a new log entry
router.post('/', async (req, res) => {
  try {
    const { action } = req.body;

    // Basic validation
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    // Check if user is authenticated
    if (!req._user || !req._user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // user_id is sent from the auth middleware, so we can access it from req._user
    const user_id = req._user.id;

    const logEntry = await logUserAction(user_id, action);
    res.status(201).json(logEntry);
  } catch (error) {
    console.error('Error in log route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/logs - Get logs (optional, for admin purposes)
router.get('/', async (req, res) => {
  try {
    const Log = require('../models/logModel');
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;