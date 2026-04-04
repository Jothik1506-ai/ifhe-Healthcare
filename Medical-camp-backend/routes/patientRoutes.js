const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const PatientFood = require('../models/patientFoodModel'); // Import new model
const { logUserAction } = require('../utils/logger');
const Doctor = require('../models/doctorModel');
const SocketEmitter = require('../utils/socketEmitter');
const { recordVolunteerVisit } = require('../utils/visitTracker');

// ✅ PATIENT SEARCH ROUTE
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let queryObj = {};
    const safeQ = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = { $regex: safeQ, $options: 'i' };

    if (type === 'name') {
      queryObj = { patient_name: regex };
    } else if (type === 'phone') {
      queryObj = { patient_phone_no: regex };
    } else if (type === 'book_no') {
      queryObj = { book_no: q }; // Exact match usually for ID/BookNo, or regex if string
    } else {
      // Default: Search Name OR Phone
      queryObj = {
        $or: [
          { patient_name: regex },
          { patient_phone_no: regex }
        ]
      };
    }

    const patients = await Patient.find(queryObj)
      .select('book_no patient_name patient_phone_no patient_age patient_sex patient_area');

    return res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ AREA AUTOCOMPLETE ROUTE
router.get('/patient-areas', async (req, res) => {
  try {
    const search = req.query.q?.trim() || '';

    // If query too short, return empty
    if (search.length < 3) {
      return res.json([]);
    }

    // 🔹 Find distinct areas using case-insensitive regex
    const areas = await Patient.distinct('patient_area', {
      patient_area: { $regex: new RegExp(search, 'i') },
    });

    // 🔹 Sort alphabetically and limit to 10
    const limited = areas
      .filter(a => a && a.trim() !== '')
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 10);

    return res.json(limited);
  } catch (err) {
    console.error('❌ Error fetching patient areas:', err);
    return res.status(500).json({ error: 'Server error fetching areas' });
  }
});

// ✅ GET route to fetch patient data by book number
// Validates that book_no is numeric to prevent conflict with other routes like /search
router.get('/:book_no(\\d+)', async (req, res) => {
  const { book_no } = req.params;

  if (isNaN(book_no) || book_no <= 0) {
    return res.status(400).send({ message: 'Invalid book number' });
  }

  try {
    const patient = await Patient.findOne({ book_no });
    if (patient) {
      if (req._user && req._user.id) {
        await logUserAction(
          req._user.id,
          `Retrieved patient details for Book #${book_no} (${patient.patient_name})`
        );
      }
      return res.status(200).send(patient);
    } else {
      return res.status(404).send({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return res.status(500).send({ message: 'Server error' });
  }
});

// ✅ POST route for patient registration / update
router.post('/', async (req, res) => {
  const {
    book_no,
    patient_name,
    patient_age,
    patient_sex,
    patient_phone_no,
    patient_area,
    chronic_history,
    other_history,
    visit_type,
    follow_up_type,
  } = req.body;

  console.log('📥 Received data:', req.body);
  console.log('👉 Chronic History:', chronic_history);
  console.log('👉 Other History:', other_history);
  try {
    // Record volunteer visit when performing patient registration
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    const existingPatient = await Patient.findOne({ book_no });

    if (existingPatient) {
      // Check if this is a pre-generated book (exists but has no name)
      const isPreGenerated = !existingPatient.patient_name;

      const originalValues = {
        patient_name: existingPatient.patient_name,
        patient_age: existingPatient.patient_age,
        patient_sex: existingPatient.patient_sex,
        patient_phone_no: existingPatient.patient_phone_no,
        patient_area: existingPatient.patient_area,
        chronic_history: existingPatient.chronic_history,
        other_history: existingPatient.other_history,
        visit_type: existingPatient.visit_type,
        follow_up_type: existingPatient.follow_up_type,
      };

      // Update fields
      existingPatient.patient_name = patient_name || existingPatient.patient_name;
      existingPatient.patient_age = patient_age || existingPatient.patient_age;
      existingPatient.patient_sex = patient_sex || existingPatient.patient_sex;
      existingPatient.patient_phone_no = patient_phone_no || existingPatient.patient_phone_no;
      existingPatient.patient_area = patient_area || existingPatient.patient_area;
      if (chronic_history !== undefined) existingPatient.chronic_history = chronic_history;
      if (other_history !== undefined) existingPatient.other_history = other_history;

      await existingPatient.save();

      // Track changes
      const changesDescription = [];
      if (originalValues.patient_name !== existingPatient.patient_name)
        changesDescription.push(`name from "${originalValues.patient_name}" to "${existingPatient.patient_name}"`);
      if (originalValues.patient_age !== existingPatient.patient_age)
        changesDescription.push(`age from "${originalValues.patient_age}" to "${existingPatient.patient_age}"`);
      if (originalValues.patient_sex !== existingPatient.patient_sex)
        changesDescription.push(`sex from "${originalValues.patient_sex}" to "${existingPatient.patient_sex}"`);
      if (originalValues.patient_phone_no !== existingPatient.patient_phone_no)
        changesDescription.push(`phone from "${originalValues.patient_phone_no}" to "${existingPatient.patient_phone_no}"`);
      if (originalValues.patient_area !== existingPatient.patient_area)
        changesDescription.push(`area from "${originalValues.patient_area}" to "${existingPatient.patient_area}"`);
      if (JSON.stringify(originalValues.chronic_history) !== JSON.stringify(existingPatient.chronic_history))
        changesDescription.push(`chronic_history updated`);
      if (originalValues.other_history !== existingPatient.other_history)
        changesDescription.push(`other_history from "${originalValues.other_history}" to "${existingPatient.other_history}"`);

      // Add visit
      const patientHistory = await PatientHistory.findOne({ book_no });
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      let isNewVisit = false;

      if (patientHistory) {
        const existingVisitIndex = patientHistory.visits.findIndex(
          visit => visit.timestamp === currentMonthYear
        );

        if (existingVisitIndex === -1) {
          isNewVisit = true;
          patientHistory.visits.push({
            timestamp: currentMonthYear,
            visit_type: visit_type || "First Time",
            follow_up_type: follow_up_type || "",
            chronic_history: chronic_history || [],
            other_history: other_history || ""
          });
        } else {
          // Update existing visit details
          patientHistory.visits[existingVisitIndex].visit_type = visit_type || patientHistory.visits[existingVisitIndex].visit_type;
          patientHistory.visits[existingVisitIndex].follow_up_type = follow_up_type || patientHistory.visits[existingVisitIndex].follow_up_type;
          patientHistory.visits[existingVisitIndex].chronic_history = chronic_history || patientHistory.visits[existingVisitIndex].chronic_history;
          patientHistory.visits[existingVisitIndex].other_history = other_history || patientHistory.visits[existingVisitIndex].other_history;
        }
        await patientHistory.save();
      } else {
        isNewVisit = true;
        const newPatientHistory = new PatientHistory({
          patientId: existingPatient._id,
          book_no,
          visits: [{
            timestamp: currentMonthYear,
            visit_type: visit_type || "First Time",
            follow_up_type: follow_up_type || "",
            chronic_history: chronic_history || [],
            other_history: other_history || ""
          }],
        });
        await newPatientHistory.save();
      }

      if (req._user && req._user.id) {
        let logMessage = '';
        if (isPreGenerated) {
          logMessage = `Registered new patient via Pre-generated Book #${book_no}: Name: ${patient_name}, Age: ${patient_age}, Sex: ${patient_sex}, Area: ${patient_area}`;
        } else {
          logMessage = `Updated existing patient: Book #${book_no} (${existingPatient.patient_name})`;
          if (changesDescription.length > 0) {
            logMessage += ` - Changed: ${changesDescription.join(', ')}`;
          } else {
            logMessage += ' - No fields changed';
          }
        }

        if (isNewVisit) {
          logMessage += ` - Recorded new visit for ${currentMonthYear}`;
        }
        await logUserAction(req._user.id, logMessage);
      }

      // Emit WebSocket event for real-time analytics updates
      // Emit for pre-generated books being filled or new visits
      if (isPreGenerated || isNewVisit) {
        const io = req.app.get('io');
        SocketEmitter.emitPatientRegistered(io, {
          book_no,
          patient_name: existingPatient.patient_name,
          patient_sex: existingPatient.patient_sex,
          patient_area: existingPatient.patient_area,
          timestamp: currentMonthYear,
          visit_type: visit_type || existingPatient.visit_type,
          follow_up_type: follow_up_type || existingPatient.follow_up_type
        });
      }

      return res.status(200).json({
        message: isPreGenerated ? 'Patient registered successfully (Pre-generated Book)' : 'Patient data updated successfully',
        redirect: true,
        patient: existingPatient
      });
    } else {
      const newPatient = new Patient({
        book_no,
        patient_name,
        patient_age,
        patient_sex,
        patient_phone_no,
        patient_area,
        chronic_history: chronic_history || [],
        other_history: other_history || "",
        qr: await QRCode.toDataURL(JSON.stringify({ book_no: book_no })),
      });
      await newPatient.save();

      const currentMonthYear = new Date().toISOString().slice(0, 7);
      const newPatientHistory = new PatientHistory({
        patientId: newPatient._id,
        book_no,
        visits: [{
          timestamp: currentMonthYear,
          visit_type: visit_type || "First Time",
          follow_up_type: follow_up_type || "",
          chronic_history: chronic_history || [],
          other_history: other_history || ""
        }],
      });
      await newPatientHistory.save();

      if (req._user && req._user.id) {
        await logUserAction(
          req._user.id,
          `Registered new patient: Book #${book_no}, Name: ${patient_name}, Age: ${patient_age}, Sex: ${patient_sex}, Area: ${patient_area}, Visit Type: ${visit_type || 'First Time'}, Follow-up: ${follow_up_type || 'N/A'} - First visit recorded for ${currentMonthYear}`
        );
      }

      // Emit WebSocket event for real-time analytics updates
      const io = req.app.get('io');
      SocketEmitter.emitPatientRegistered(io, {
        book_no,
        patient_name,
        patient_sex,
        patient_area,
        timestamp: currentMonthYear,
        visit_type: visit_type || "First Time",
        follow_up_type: follow_up_type || ""
      });

      return res.status(201).json({
        message: 'New patient registered successfully and visit recorded',
        redirect: true,
        patient: newPatient,
      });
    }
  } catch (error) {
    console.error('Error saving patient data:', error);
    return res.status(500).send({ message: 'Server error' });
  }
});

// ✅ POST route for volunteer patient food
router.post('/volunteer/patient-food', async (req, res) => {
  const { book_no } = req.body;
  const volunteer_id = req._user?.id; // Get volunteer ID from authenticated user

  if (!book_no || !volunteer_id) {
    return res.status(400).send({ message: 'Book number and authenticated volunteer ID are required.' });
  }

  try {
    // Record volunteer visit when distributing patient food
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    const patient = await Patient.findOne({ book_no });

    if (!patient) {
      return res.status(404).send({ message: 'Patient not found.' });
    }

    // Check if the patient has registered for the current month
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory || !patientHistory.visits.some(visit => visit.timestamp === currentMonthYear)) {
      return res.status(400).send({ message: 'Patient has not registered for the current month.' });
    }

    // Check if patient support already exists for this book number for the current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const existingPatientFood = await PatientFood.findOne({
      book_no,
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    if (existingPatientFood) {
      return res.status(400).send({ message: 'Patient food already distributed for this book number for the current month.' });
    }

    // Create a new patient food entry
    const newPatientFood = new PatientFood({
      book_no,
      volunteer_id,
    });
    await newPatientFood.save();

    // Log the patient food interaction
    await logUserAction(
      volunteer_id,
      `Volunteer ${volunteer_id} provided food for Patient Book #${book_no} (${patient.patient_name})`
    );

    return res.status(200).send({ message: 'Patient food distributed successfully.' });
  } catch (error) {
    console.error('Error logging patient food:', error);
    return res.status(500).send({ message: 'Server error.' });
  }
});

router.post('/queue/:queue_type', async (req, res) => {
  const { queue_type } = req.params;
  const { doctor_id } = req.body;

  try {
    if (!queue_type) {
      return res.status(400).json({ message: "Queue type is required in the route parameter." });
    }

    if (!doctor_id) {
      // If no doctor_id is provided, fetch queues from all doctors
      const doctors = await Doctor.find({});
      let allQueues = [];

      doctors.forEach(doc => {
        const docQueue = doc.patient_queue
          .filter(q => q.queue_type === queue_type)
          .map(item => ({
            ...item.toObject(),
            doctor_name: doc.doctor_name,
            doctor_id: doc.doctor_id
          }));
        allQueues = allQueues.concat(docQueue);
      });

      // Sort by assigned_at
      allQueues.sort((a, b) => new Date(a.assigned_at) - new Date(b.assigned_at));

      return res.status(200).json({ queue: allQueues });
    }

    // Fetch the doctor by ID and filter their patient_queue by queue_type
    const doctor = await Doctor.findOne({ doctor_id: doctor_id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }
    const filteredQueue = doctor.patient_queue
      .filter(q => q.queue_type === queue_type)
      .sort((a, b) => a.assigned_at - b.assigned_at);

    return res.status(200).json({ queue: filteredQueue });
  } catch (error) {
    console.error("Error fetching patient queue:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }

});

module.exports = router;
