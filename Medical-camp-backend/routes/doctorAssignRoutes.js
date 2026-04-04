const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const PatientHistory = require('../models/patientHistoryModel');
const Patient = require('../models/patientModel');
const { logUserAction } = require('../utils/logger');
const Vitals = require('../models/vitalsModel');
const SocketEmitter = require('../utils/socketEmitter');
const { recordVolunteerVisit } = require('../utils/visitTracker');

// Fetch all doctors
router.get('/get_doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ doctor_availability: true }); // Fetch all doctors from the database

    // Log successful retrieval of available doctors
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved list of available doctors (${doctors.length} doctors)`
      );
    }

    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Check assignment status
router.get('/status/:book_no', async (req, res) => {
  const { book_no } = req.params;
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  try {
    const patientHistory = await PatientHistory.findOne({ book_no });
    if (!patientHistory) return res.json({ assigned: false });

    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);
    if (!visit || !visit.doctor_id) return res.json({ assigned: false });

    const doctor = await Doctor.findOne({ doctor_id: visit.doctor_id });
    return res.json({
      assigned: true,
      doctor_name: doctor ? doctor.doctor_name : 'Unknown',
      doctor_id: visit.doctor_id
    });
  } catch (error) {
    console.error("Error checking status:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Assign a doctor to a patient
router.post('/', async (req, res) => {
  const { book_no, doc_name } = req.body;

  try {
    // Record volunteer visit when assigning doctor
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    const doctor = await Doctor.findOne({ doctor_name: doc_name, doctor_availability: true });
    if (!doctor) {
      return res.status(404).send({ message: 'Doctor not found' });
    }

    const doc_id = doctor.doctor_id;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    let patientHistory = await PatientHistory.findOne({ book_no });

    // If patient history does not exist, show error.
    if (!patientHistory) {
      return res.status(404).send({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found' });
    }

    const visitIndex = patientHistory.visits.findIndex(
      (visit) => visit.timestamp === currentMonthYear
    );

    if (visitIndex === -1) {
      return res.status(404).send({ message: 'Visit not found for the current month and year' });
    }

    const previousDoctorId = patientHistory.visits[visitIndex].doctor_id;

    // Handle Reassignment
    if (previousDoctorId) {
      // If same doctor, do nothing
      if (previousDoctorId === doc_id) {
        return res.status(200).send({ message: 'Doctor already assigned to this patient.' });
      }

      // Find the previous doctor and remove patient from their queue
      const previousDoctor = await Doctor.findOne({ doctor_id: previousDoctorId });
      if (previousDoctor) {
        previousDoctor.patient_queue = previousDoctor.patient_queue.filter(q => String(q.book_no) !== String(book_no));
        await previousDoctor.save();
      }

      // Add to doctor history if array exists
      if (!patientHistory.visits[visitIndex].doctor_history) {
        patientHistory.visits[visitIndex].doctor_history = [];
      }
      patientHistory.visits[visitIndex].doctor_history.push({
        doctor_id: previousDoctorId,
        assigned_at: new Date() // Ideally capture real time of previous assignment if possible, but now serves as 'archived at'
      });
    }

    // Assign new doctor
    patientHistory.visits[visitIndex].doctor_id = doc_id;

    // Add new assignment to history as well (current active)
    if (!patientHistory.visits[visitIndex].doctor_history) {
      patientHistory.visits[visitIndex].doctor_history = [];
    }
    patientHistory.visits[visitIndex].doctor_history.push({
      doctor_id: doc_id,
      assigned_at: new Date()
    });

    await patientHistory.save();

    // Add to NEW doctor's queue
    const patient_queue = doctor.patient_queue.find(queue => queue.book_no == book_no);

    if (!patient_queue) {
      doctor.patient_queue.push({
        book_no,
        patient_name: patient.patient_name,
        queue_type: "vitals",
      });
      await doctor.save();
    }

    if (req._user && req._user.id) {
      let logMessage = `Assigned doctor ${doc_name} (ID: ${doc_id}) to patient with book number ${book_no} for ${currentMonthYear}`;
      if (previousDoctorId) {
        logMessage += ` (replacing doctor ID: ${previousDoctorId})`;
      }
      await logUserAction(req._user.id, logMessage);
    }

    // Emit WebSocket event for real-time queue updates
    const io = req.app.get('io');
    SocketEmitter.emitDoctorAssigned(io, {
      book_no,
      doctor_id: doc_id,
      doctor_name: doc_name,
      patient_name: patient.patient_name,
      queue_type: 'vitals'
    });

    // Emit analytics event for consultation tracking
    SocketEmitter.emitAnalyticsEvent(io, 'consultation-started', {
      book_no,
      doctor_id: doc_id,
      doctor_name: doc_name
    });

    const message = previousDoctorId ? 'Doctor reassigned successfully' : 'Doctor assigned successfully';
    return res.status(200).send({ message });
  } catch (error) {
    console.error('Error:', error);
    return res.status(400).send({ message: error.message });
  }
});

router.post('/done/:book_id', async (req, res) => {
  const { book_id } = req.params;
  const Queue = require('../models/queueModel'); // Import Queue model

  console.log('📋 Processing consultation completion for book_no:', book_id);

  try {
    // Record volunteer visit when completing consultation
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    // Find the doctor who has this patient in their queue
    const doctor = await Doctor.findOne({ "patient_queue.book_no": book_id });
    if (!doctor) {
      console.log('❌ Doctor not found for book_no:', book_id);
      return res.status(404).json({ message: "Doctor with this patient in queue not found." });
    }

    console.log('✅ Found doctor:', doctor.doctor_name, 'for book_no:', book_id);

    // Check if the patient in the queue has queue_type "consultation" before removing
    const patientQueueEntry = doctor.patient_queue.find(
      (queue) => String(queue.book_no) === String(book_id)
    );

    if (!patientQueueEntry) {
      console.log('❌ Patient not found in doctor queue for book_no:', book_id);
      return res.status(404).json({ message: "Patient not found in doctor's queue." });
    }

    console.log('📊 Patient queue entry:', patientQueueEntry);

    if (patientQueueEntry.queue_type !== "consultation") {
      console.log('⚠️ Patient not in consultation queue. Current queue_type:', patientQueueEntry.queue_type);
      return res.status(400).json({ message: "Patient doctor consultation is not done. Cannot remove from doctor's queue." });
    }

    console.log('✅ Patient is in consultation queue, proceeding with removal...');

    // Remove from doctor's internal queue
    doctor.patient_queue = doctor.patient_queue.filter(
      (queue) => String(queue.book_no) !== String(book_id)
    );
    await doctor.save();

    // Emit WebSocket event for doctor queue update
    const io = req.app.get('io');
    SocketEmitter.emitConsultationCompleted(io, {
      book_no: parseInt(book_id),
      doctor_id: doctor.doctor_id,
      doctor_name: doctor.doctor_name
    });

    // Also remove from Queue collection if exists
    const queueEntry = await Queue.findOne({ book_no: parseInt(book_id) });
    if (queueEntry) {
      const affectedDoctors = queueEntry.doctor_list;
      await Queue.deleteOne({ book_no: parseInt(book_id) });

      // Emit WebSocket event for real-time updates
      await SocketEmitter.emitQueueRemoved(io, Queue, parseInt(book_id), affectedDoctors);
    }

    return res.status(200).json({ message: "Patient removed from doctor's queue successfully." });
  } catch (error) {
    console.error("Error removing patient from doctor's queue:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
})

module.exports = router;