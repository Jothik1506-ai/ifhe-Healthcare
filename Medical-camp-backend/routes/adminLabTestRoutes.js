const express = require('express');
const router = express.Router();
const LabTest = require('../models/labTestModel');
// @desc    Add a new lab test
// @route   POST /api/admin/labtests
// @access  Private (Admin only - relies on global authMiddleware)
router.post('/', async (req, res) => {
  try {
    // Basic check for admin role if needed, assuming req._user is populated by authMiddleware
    if (!req._user || req._user.user_type !== 'admin') { // Check for admin user_type
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Lab test name is required.' });
    }

    const labTest = new LabTest({ name });
    await labTest.save();
    res.status(201).json({ message: 'Lab test added successfully!', labTest });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Lab test with this name already exists.' });
    }
    console.error('Error adding lab test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all lab tests
// @route   GET /api/admin/labtests
// @access  Private (Admin/Volunteer - relies on global authMiddleware)
router.get('/', async (req, res) => {
  try {
    // Basic check for authenticated user if needed
    if (!req._user) {
      return res.status(401).json({ message: 'Access denied. Authentication required.' });
    }
    const labTests = await LabTest.find({});
    res.status(200).json({ labTests });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update a lab test
// @route   PUT /api/admin/labtests/:id
// @access  Private (Admin only - relies on global authMiddleware)
router.put('/:id', async (req, res) => {
  try {
    // Basic check for admin role if needed
    if (!req._user || req._user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Lab test name is required.' });
    }

    const labTest = await LabTest.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found.' });
    }
    res.status(200).json({ message: 'Lab test updated successfully!', labTest });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Lab test with this name already exists.' });
    }
    console.error('Error updating lab test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete a lab test
// @route   DELETE /api/admin/labtests/:id
// @access  Private (Admin only - relies on global authMiddleware)
router.delete('/:id', async (req, res) => {
  try {
    // Basic check for admin role if needed
    if (!req._user || req._user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;

    const labTest = await LabTest.findByIdAndDelete(id);

    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found.' });
    }
    res.status(200).json({ message: 'Lab test deleted successfully!' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
