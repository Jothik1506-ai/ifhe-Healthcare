const express = require('express');
const router = express.Router();
const PatientHistory = require('../models/patientHistoryModel');
const Vitals = require('../models/vitalsModel');
const { logUserAction } = require('../utils/logger');

// GET /api/patient-status/:book_no
router.get('/:book_no', async (req, res) => {
  const { book_no } = req.params;
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  try {
    const patientHistory = await PatientHistory.findOne({ book_no });
    const vitals = await Vitals.findOne({ book_no, timestamp: currentMonthYear });

    let doctorAssigned = false;
    let medicinesPrescribed = false;
    let medicinesGiven = false;
    let counsellingDone = false;

    if (patientHistory) {
      const currentVisit = patientHistory.visits.find(
        (visit) => visit.timestamp === currentMonthYear
      );

      if (currentVisit) {
        doctorAssigned = !!currentVisit.doctor_id;
        medicinesPrescribed = currentVisit.medicines_prescribed && currentVisit.medicines_prescribed.length > 0;
        medicinesGiven = currentVisit.medicines_given && currentVisit.medicines_given.length > 0;
        counsellingDone = currentVisit.counselling;
      }
    }

    const vitalsRecorded = !!vitals;

    // Log the patient status retrieval
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved status for patient (Book #${book_no}) for ${currentMonthYear}`
      );
    }

    return res.status(200).json({
      book_no,
      status: {
        doctorAssigned,
        vitalsRecorded,
        medicinesPrescribed,
        medicinesGiven,
        counsellingDone
      }
    });

  } catch (error) {
    console.error('Error fetching patient status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
