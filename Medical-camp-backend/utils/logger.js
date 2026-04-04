const Log = require('../models/logModel');
const mongoose = require('mongoose');
const { formatInTimeZone } = require('date-fns-tz');

/**
 * Logs user actions to the database
 * @param {string|ObjectId} user_id - ID of the user performing the action
 * @param {string} action - Description of the action performed
 * @returns {Promise<Object>} The created log entry
 */
const logUserAction = async (user_id, action) => {
  try {
    // Get current timestamp in YYYY-MM-DD HH:MM format in IST timezone
    const now = new Date();
    const timestamp = formatInTimeZone(now, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
    
    // Create and save the log entry
    const logEntry = new Log({
      user_id,
      action,
      timestamp
    });
    
    await logEntry.save();
    console.log(`Logged: User ${user_id} - ${action}`);
    return logEntry;
  } catch (error) {
    console.error('Error logging action:', error);
    // Still return without throwing to avoid disrupting the main flow
    return { error: error.message };
  }
};

module.exports = { logUserAction };