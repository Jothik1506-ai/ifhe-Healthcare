const User = require('../models/userModel');

/**
 * Records a visit for a volunteer if they haven't visited this month yet
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {Promise<boolean>} - True if visit was recorded, false otherwise
 */
const recordVolunteerVisit = async (userId) => {
  try {
    if (!userId) {
      console.warn('recordVolunteerVisit called without userId');
      return false;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User with ID ${userId} not found`);
      return false;
    }

    if (user.user_type !== 'volunteer') {
      // Only track visits for volunteers
      return false;
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

    // Check if visit already exists for this month
    const visitExists = user.list_of_visits.some(visit =>
      visit.timestamp === currentMonthYear
    );

    if (!visitExists) {
      user.list_of_visits.push({ timestamp: currentMonthYear });
      await user.save();

      console.log(`Visit recorded for volunteer ${user.user_name} (ID: ${user.user_id}) on ${currentMonthYear}`);
      return true;
    } else {
      // Visit already recorded for this month
      return false;
    }
  } catch (error) {
    console.error('Error recording volunteer visit:', error);
    return false;
  }
};

/**
 * Records a visit with additional activity details
 * @param {string} userId - The MongoDB ObjectId of the user
 * @param {string} activityType - Type of activity (e.g., 'patient_registration', 'vitals_entry')
 * @param {Object} activityDetails - Additional details about the activity
 * @returns {Promise<boolean>} - True if visit was recorded, false otherwise
 */
const recordVolunteerVisitWithActivity = async (userId, activityType, activityDetails = {}) => {
  try {
    if (!userId) {
      console.warn('recordVolunteerVisitWithActivity called without userId');
      return false;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User with ID ${userId} not found`);
      return false;
    }

    if (user.user_type !== 'volunteer') {
      // Only track visits for volunteers
      return false;
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const currentTime = new Date();

    // Check if visit already exists for this month
    let visitIndex = user.list_of_visits.findIndex(visit =>
      visit.timestamp === currentMonthYear
    );

    if (visitIndex === -1) {
      // Create new visit entry
      user.list_of_visits.push({
        timestamp: currentMonthYear,
        activities: [{
          type: activityType,
          timestamp: currentTime,
          details: activityDetails
        }]
      });
      await user.save();

      console.log(`Visit recorded for volunteer ${user.user_name} (ID: ${user.user_id}) on ${currentMonthYear} with activity: ${activityType}`);
      return true;
    } else {
      // Visit exists, check if this specific activity was already recorded recently
      const existingActivity = user.list_of_visits[visitIndex].activities?.find(activity =>
        activity.type === activityType &&
        Math.abs(activity.timestamp - currentTime) < 300000 // Within 5 minutes
      );

      if (!existingActivity) {
        // Add activity to existing visit
        if (!user.list_of_visits[visitIndex].activities) {
          user.list_of_visits[visitIndex].activities = [];
        }
        user.list_of_visits[visitIndex].activities.push({
          type: activityType,
          timestamp: currentTime,
          details: activityDetails
        });
        await user.save();

        console.log(`Activity '${activityType}' recorded for volunteer ${user.user_name} (ID: ${user.user_id}) on ${currentMonthYear}`);
      }
      return true;
    }
  } catch (error) {
    console.error('Error recording volunteer visit with activity:', error);
    return false;
  }
};

module.exports = {
  recordVolunteerVisit,
  recordVolunteerVisitWithActivity
};
