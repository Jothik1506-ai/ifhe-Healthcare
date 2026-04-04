const express = require('express');
const router = express.Router();
const LabTestResult = require('../models/labTestResultModel');
const Patient = require('../models/patientModel'); // Import Patient model
const PatientHistory = require('../models/patientHistoryModel'); // Import PatientHistory model
const { recordVolunteerVisit } = require('../utils/visitTracker');

// @desc    Submit new lab test results
// @route   POST /api/labtests
// @access  Private (Volunteer)
router.post('/', async (req, res) => {
  const { book_no, labTests } = req.body;

  if (!book_no || !labTests || labTests.length === 0) {
    return res.status(400).json({ message: 'Please enter Book_No and select at least one lab test.' });
  }

  try {
    // Record volunteer visit when submitting lab tests
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    // Check if the patient exists
    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).json({ message: 'Patient with this Book_No not found.' });
    }

    // Check if a doctor's prescription exists for the current month
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(400).json({ message: 'No patient history found for this Book_No. A doctor assignment is required.' });
    }

    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);

    if (!visit || !visit.doctor_id) {
      return res.status(400).json({ message: 'No doctor assigned for this patient for the current month.' });
    }

    let labTestResult;
    let message;

    // Find and update the existing record or create a new one
    labTestResult = await LabTestResult.findOneAndUpdate(
      { book_no },
      { $addToSet: { labTests: { $each: labTests } } }, // Use $addToSet to append unique lab tests
      { new: true, upsert: true } // Return the updated document, create if not exists
    );

    if (labTestResult.labTests.length === labTests.length) { // Check if it was an initial creation or all new tests
      message = 'Lab test records submitted successfully!';
    } else {
      message = 'Lab test records updated successfully!';
    }

    res.status(200).json({ message, labTestResult }); // Return 200 for both create/update success
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message }); // Include error message for debugging
  }
});

// @desc    Get lab test results by Book No
// @route   GET /api/labtests/:book_no
// @access  Private (Volunteer/Doctor/Admin)
router.get('/:book_no', async (req, res) => {
  try {
    const labTestResult = await LabTestResult.findOne({ book_no: req.params.book_no });

    if (!labTestResult) {
      return res.status(404).json({ message: 'Lab test results not found for this Book_No.' });
    }

    res.status(200).json(labTestResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
