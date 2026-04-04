const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PatientHistory = require('../models/patientHistoryModel');
const Patient = require('../models/patientModel');
const Inventory = require('../models/inventoryModel');
const { logUserAction } = require('../utils/logger');
const { recordVolunteerVisit } = require('../utils/visitTracker');

router.post('/doctor-prescription', async (req, res) => {
  try {
    const { book_no, prescriptions } = req.body;

    if (!book_no || !prescriptions || !Array.isArray(prescriptions)) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    // Validate prescription quantities
    for (const prescription of prescriptions) {
      if (prescription.quantity && prescription.quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for medicine ${prescription.medicine_id}. Quantity must be greater than 0.`
        });
      }
    }

    // Check if the patient exists
    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Record volunteer visit when adding prescription
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Check if patient history exists for the current timestamp
    const patientHistory = await PatientHistory.findOne({ book_no });
    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient not registered.' });
    }

    // Check if a visit exists for the current timestamp
    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);
    if (!visit) {
      return res.status(404).json({ message: 'Patient not registered for the current month.' });
    }

    // Check if doctor_id is assigned for the current timestamp
    if (!visit.doctor_id) {
      return res.status(400).json({ message: 'Doctor not assigned.' });
    }

    // Ensure each prescription has a status field (defaults to 'prescribed')
    const formattedPrescriptions = prescriptions.map(p => ({
      ...p,
      status: p.status || 'prescribed'
    }));

    // Add prescriptions to the visit
    visit.medicines_prescribed.push(...formattedPrescriptions);

    await patientHistory.save();

    // Log the prescription action
    if (req._user && req._user.id) {
      const medicinesSummary = prescriptions.map(med =>
        `${med.medicine_id} (Qty: ${med.quantity})`
      ).join(', ');

      await logUserAction(
        req._user.id,
        `Added prescription for patient (Book #${book_no}) - Medicines: ${medicinesSummary}`
      );
    }

    // Emit WebSocket event for real-time analytics
    const io = req.app.get('io');
    const SocketEmitter = require('../utils/socketEmitter');
    SocketEmitter.emitAnalyticsEvent(io, 'prescription-generated', {
      book_no,
      prescription_count: prescriptions.length
    });

    return res.status(200).json({ message: 'Prescription added successfully!' });
  } catch (error) {
    console.error('Error in doctor prescription route:', error);
    return res.status(500).json({
      message: 'Server error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// Get previous 2 months prescriptions
router.get('/:book_no/previous-prescriptions', async (req, res) => {
  try {
    const { book_no } = req.params;
    console.log(`[GET] Fetching previous prescriptions (latest 2 visits) for book_no: ${book_no}`);
    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      console.log(`[GET] No history record found for book_no: ${book_no}`);
      return res.status(200).json({ visits: [] });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Get last 2 visits (excluding current month)
    const previousVisits = patientHistory.visits
      .filter(v => v.timestamp !== currentMonthYear)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 2);

    console.log(`[GET] Found ${previousVisits.length} previous visits for book_no: ${book_no}`);

    const formattedVisits = previousVisits.map(visit => ({
      timestamp: visit.timestamp,
      medicines: visit.medicines_prescribed.map(med => ({
        medicine_id: med.medicine_id,
        quantity: med.quantity,
        days: med.dosage_schedule?.days || 0,
        morning: med.dosage_schedule?.morning || false,
        afternoon: med.dosage_schedule?.afternoon || false,
        night: med.dosage_schedule?.night || false,
        isMedicine: !!(
          med.dosage_schedule?.days ||
          med.dosage_schedule?.morning ||
          med.dosage_schedule?.afternoon ||
          med.dosage_schedule?.night
        )
      }))
    }));

    return res.status(200).json({ visits: formattedVisits });
  } catch (error) {
    console.error('Error fetching previous prescriptions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Existing medicinal pickup route
router.get('/medicine-pickup/:book_no', async (req, res) => {
  try {
    const { book_no } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'No prescription found for this book number.' });
    }

    const visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);

    if (!visit || !Array.isArray(visit.medicines_prescribed) || visit.medicines_prescribed.length === 0) {
      return res.status(404).json({ message: 'No valid prescription data for this month.' });
    }

    // Filter medicines by status - only show 'prescribed' medicines (not yet picked up)
    const prescribedMedicines = visit.medicines_prescribed.filter(med =>
      med.status === 'prescribed'
    );

    if (prescribedMedicines.length === 0) {
      return res.status(200).json({
        message: 'No medicines pending pickup.',
        medicines_prescribed: []
      });
    }

    const prescribedMedicineIds = prescribedMedicines.map(med => med.medicine_id);

    const inventoryItems = await Inventory.find({
      medicine_id: { $in: prescribedMedicineIds }
    });

    const medicinesForPickup = prescribedMedicines.map(med => {
      const inventoryItem = inventoryItems.find(item => item.medicine_id === med.medicine_id);

      const batches = (inventoryItem?.medicine_details || []).map(batch => ({
        medicine_name: batch.medicine_name,
        expiry_date: batch.expiry_date,
        available_quantity: batch.quantity,
        quantity_taken: 0 // Placeholder for frontend input
      }));

      return {
        _id: med._id, // Include the MongoDB ObjectId for the prescription entry
        medicine_id: med.medicine_id,
        quantity: med.quantity,
        status: med.status,
        replacement_medicine_id: med.replacement_medicine_id,
        replacement_quantity: med.replacement_quantity,
        status_note: med.status_note,
        medicine_formulation: inventoryItem?.medicine_formulation || 'N/A',
        total_quantity: inventoryItem?.total_quantity || 0, // Include total_quantity
        batches
      };
    });

    // Log the medicine pickup info retrieval
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved medicine pickup information for patient (Book #${book_no}) - ${medicinesForPickup.length} medicine(s) pending pickup`
      );
    }

    return res.status(200).json({ medicines_prescribed: medicinesForPickup });
  } catch (error) {
    console.error('Error fetching medicine pickup info:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update medicine status (replaced, buy_outside, out_of_stock)
router.put('/medicine-status/:book_no/:medicine_id', async (req, res) => {
  try {
    const { book_no, medicine_id } = req.params;
    const { status, replacement_medicine_id, replacement_quantity, status_note } = req.body;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Validate medicine_id format
    if (!mongoose.Types.ObjectId.isValid(medicine_id)) {
      return res.status(400).json({ message: 'Invalid medicine ID format.' });
    }

    // Validate status value
    const validStatuses = ['replaced', 'buy_outside', 'out_of_stock'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // For 'replaced' status, require replacement_medicine_id and replacement_quantity
    if (status === 'replaced') {
      if (!replacement_medicine_id || !replacement_quantity) {
        return res.status(400).json({
          message: 'replacement_medicine_id and replacement_quantity are required when status is "replaced"'
        });
      }
      if (replacement_quantity <= 0) {
        return res.status(400).json({
          message: 'replacement_quantity must be greater than 0'
        });
      }
    }

    // Find and update the medicine status
    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      console.log(`Medicine Status Update: Patient history not found for book_no: ${book_no}`);
      return res.status(404).json({ message: 'Patient history not found.' });
    }

    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);

    if (!visit) {
      console.log(`Medicine Status Update: No visit found for current month (${currentMonthYear}) for book_no: ${book_no}`);
      return res.status(404).json({ message: 'No visit found for current month.' });
    }

    const medicine = visit.medicines_prescribed.find(
      m => m._id.toString() === medicine_id
    );

    if (!medicine) {
      console.log(`Medicine Status Update: Medicine ID ${medicine_id} not found in prescription for book_no: ${book_no}`);
      return res.status(404).json({ message: 'Medicine not found in prescription.' });
    }

    // Update the medicine status and related fields
    medicine.status = status;
    medicine.status_note = status_note || '';

    if (status === 'replaced') {
      medicine.replacement_medicine_id = replacement_medicine_id;
      medicine.replacement_quantity = replacement_quantity;

      // Add replacement medicine to medicines_given
      visit.medicines_given.push({
        medicine_id: replacement_medicine_id,
        quantity: replacement_quantity
      });
    } else {
      // Clear replacement fields if not replaced
      medicine.replacement_medicine_id = undefined;
      medicine.replacement_quantity = undefined;
    }

    await patientHistory.save();

    // Log the status update action
    if (req._user && req._user.id) {
      let logMessage = `Updated medicine status to "${status}" for medicine (ID: ${medicine.medicine_id}) for patient (Book #${book_no})`;
      if (status === 'replaced') {
        logMessage += ` - Replaced with medicine ${replacement_medicine_id} (Qty: ${replacement_quantity})`;
      }
      await logUserAction(req._user.id, logMessage);
    }

    return res.status(200).json({
      message: 'Medicine status updated successfully!',
      medicine: {
        medicine_id: medicine.medicine_id,
        status: medicine.status,
        replacement_medicine_id: medicine.replacement_medicine_id,
        replacement_quantity: medicine.replacement_quantity,
        status_note: medicine.status_note
      }
    });
  } catch (error) {
    console.error('Error updating medicine status:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/medicine-pickup', async (req, res) => {
  try {
    const { book_no, medicinesGiven, statusUpdates } = req.body;

    if (!book_no || !medicinesGiven || !Array.isArray(medicinesGiven)) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    // Record volunteer visit when dispensing medicines
    if (req._user && req._user.id) {
      await recordVolunteerVisit(req._user.id);
    }

    let patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history not found.' });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);
    let visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);

    if (!visit) {
      return res.status(404).json({ message: 'No prescription found for this month.' });
    }

    // Create a list of medicine IDs to fetch from inventory
    const medicineIds = [...new Set(medicinesGiven.map(med => med.medicine_id))];

    // Fetch all inventory items for these medicines
    const inventoryItems = await Inventory.find({
      medicine_id: { $in: medicineIds }
    });

    let insufficientStock = [];

    // Check stock availability for each medicine
    for (let med of medicinesGiven) {
      const inventoryItem = inventoryItems.find(item => String(item.medicine_id) === String(med.medicine_id));

      if (!inventoryItem) {
        insufficientStock.push(`Medicine ID: ${med.medicine_id}`);
        continue;
      }

      if (med.expiry_date && med.expiry_date !== '') {
        // Specific batch check
        const batchDetail = inventoryItem.medicine_details.find(
          detail =>
            new Date(detail.expiry_date).toDateString() === new Date(med.expiry_date).toDateString()
        );

        if (!batchDetail) {
          insufficientStock.push(`Medicine ID: ${med.medicine_id} (Batch not found)`);
          continue;
        }

        if (batchDetail.quantity < med.quantity) {
          insufficientStock.push(`${med.medicine_name || med.medicine_id} (Batch Available: ${batchDetail.quantity}, Requested: ${med.quantity})`);
        }
      } else {
        // Total quantity check for auto-selection (FIFO)
        if (inventoryItem.total_quantity < med.quantity) {
          insufficientStock.push(`${med.medicine_name || med.medicine_id} (Total Available: ${inventoryItem.total_quantity}, Requested: ${med.quantity})`);
        }
      }
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: 'Not enough stock for the following medicines',
        insufficientStock
      });
    }

    // Create a list of medicine details for logging
    const medicineDetails = medicinesGiven.map(med => {
      const inventoryItem = inventoryItems.find(item => String(item.medicine_id) === String(med.medicine_id));
      return {
        name: inventoryItem?.medicine_formulation || med.medicine_id,
        id: med.medicine_id,
        quantity: med.quantity,
        expiry: med.expiry_date ? new Date(med.expiry_date).toISOString().split('T')[0] : 'Auto-Select'
      };
    });

    const updatedMedicineQuantities = [];

    // Update inventory
    for (let med of medicinesGiven) {
      const inventoryItem = inventoryItems.find(item => String(item.medicine_id) === String(med.medicine_id));

      if (!inventoryItem) continue;

      const beforeQuantity = inventoryItem.total_quantity;

      if (med.expiry_date && med.expiry_date !== '') {
        // Specific batch selected (Strict matching)
        const batchDetail = inventoryItem.medicine_details.find(
          detail =>
            new Date(detail.expiry_date).toDateString() === new Date(med.expiry_date).toDateString()
        );

        if (batchDetail) {
          batchDetail.quantity -= med.quantity;
        }
      } else {
        // No batch selected (FIFO / Auto-selection for replacements)
        // Sort by expiry date (ascending)
        inventoryItem.medicine_details.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

        let remainingQtyToDeduct = med.quantity;

        for (let batch of inventoryItem.medicine_details) {
          if (remainingQtyToDeduct <= 0) break;

          if (batch.quantity > 0) {
            const deduct = Math.min(batch.quantity, remainingQtyToDeduct);
            batch.quantity -= deduct;
            remainingQtyToDeduct -= deduct;
          }
        }
      }

      // Update total quantity
      inventoryItem.total_quantity -= med.quantity;
      await inventoryItem.save();

      const afterQuantity = inventoryItem.total_quantity;

      updatedMedicineQuantities.push({
        medicine_id: med.medicine_id,
        before_quantity: beforeQuantity,
        after_quantity: afterQuantity,
        picked_up_quantity: med.quantity
      });
    }

    // Update patient history with given medicines
    const formattedMedicinesGiven = medicinesGiven.map(med => ({
      medicine_id: String(med.medicine_id),
      quantity: Number(med.quantity)
    }));

    visit.medicines_given.push(...formattedMedicinesGiven);

    // Update status based on statusUpdates
    if (statusUpdates && Array.isArray(statusUpdates)) {
      for (const update of statusUpdates) {
        const prescribedMedicine = visit.medicines_prescribed.find(
          p => String(p.medicine_id) === String(update.medicine_id) // Ensure string comparison
        );
        if (prescribedMedicine) {
          prescribedMedicine.status = update.status;
          prescribedMedicine.status_note = update.status_note;

          if (update.status === 'replaced') {
            prescribedMedicine.replacement_medicine_id = update.replacement_medicine_id;
            prescribedMedicine.replacement_quantity = update.replacement_quantity;
          } else {
            // Clear replacement fields for other statuses (or if reverting to prescribed)
            prescribedMedicine.replacement_medicine_id = undefined;
            prescribedMedicine.replacement_quantity = undefined;
          }
        }
      }
    }

    // Update status to 'dispensed' for picked up medicines (only if not already updated)
    for (let med of medicinesGiven) {
      const prescribedMedicine = visit.medicines_prescribed.find(
        p => p.medicine_id === med.medicine_id && p.status === 'prescribed'
      );
      if (prescribedMedicine) {
        prescribedMedicine.status = 'dispensed';
      }
    }

    await patientHistory.save();

    // Log the medicine dispensing action
    if (req._user && req._user.id) {
      const medicinesSummary = medicineDetails.map(med =>
        `(ID: ${med.id}, Qty: ${med.quantity}, Exp: ${med.expiry})`
      ).join(', ');

      await logUserAction(
        req._user.id,
        `Dispensed medicines to patient (Book #${book_no}) - ${medicinesGiven.length} medicine(s): ${medicinesSummary}`
      );
    }

    // Emit WebSocket event for real-time analytics (patient count)
    const io = req.app.get('io');
    const SocketEmitter = require('../utils/socketEmitter');
    SocketEmitter.emitAnalyticsEvent(io, 'medicine-received', {
      book_no,
      patient_count: 1 // One patient received medicines
    });

    // Emit individual medicine dispensing events for inventory tracking
    for (let med of medicinesGiven) {
      SocketEmitter.emitAnalyticsEvent(io, 'medicine-dispensed', {
        book_no,
        medicine_id: med.medicine_id,
        quantity: med.quantity
      });
    }

    return res.status(200).json({
      message: 'Medicine pickup confirmed, inventory updated, and patient history preserved!',
      updated_quantities: updatedMedicineQuantities
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal Server error', error: error.message });
  }
});

router.get('/medicine-verification/:book_no', async (req, res) => {
  try {
    const { book_no } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'No patient history found.' });
    }

    let visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);
    if (!visit) {
      return res.status(404).json({ message: 'No records found for this month.' });
    }

    // Include all status fields in the response - no filtering
    const prescribedWithStatus = visit.medicines_prescribed.map(med => ({
      medicine_id: med.medicine_id,
      quantity: med.quantity,
      dosage_schedule: med.dosage_schedule,
      status: med.status || 'prescribed',
      replacement_medicine_id: med.replacement_medicine_id,
      replacement_quantity: med.replacement_quantity,
      status_note: med.status_note
    }));

    // Log the verification check
    if (req._user && req._user.id) {
      const prescribedCount = visit.medicines_prescribed.length;
      const dispensedCount = visit.medicines_given.length;
      await logUserAction(
        req._user.id,
        `Verified medicine dispensing for patient (Book #${book_no}) - ${prescribedCount} prescribed, ${dispensedCount} dispensed`
      );
    }

    return res.status(200).json({
      medicines_prescribed: prescribedWithStatus,
      medicines_given: visit.medicines_given
    });
  } catch (error) {
    console.error('Error fetching verification data:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:book_no/prescription/:medicine_id', async (req, res) => {
  try {
    const { book_no, medicine_id } = req.params;
    const { new_quantity } = req.body;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    if (!mongoose.Types.ObjectId.isValid(medicine_id)) {
      return res.status(400).json({ message: 'Invalid medicine ID format.' });
    }
    if (typeof new_quantity !== 'number' || new_quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity provided.' });
    }

    const updatedPatientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
        'visits.medicines_prescribed._id': new mongoose.Types.ObjectId(medicine_id),
      },
      {
        $set: {
          'visits.$.medicines_prescribed.$[elem].quantity': new_quantity,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(medicine_id) }],
      }
    );

    if (!updatedPatientHistory) {
      return res.status(404).json({ message: 'Patient history, visit, or medicine not found.' });
    }

    // Log the prescription update action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Updated prescribed quantity for medicine (ID: ${medicine_id}) to ${new_quantity} for patient (Book #${book_no})`
      );
    }

    return res.status(200).json({ message: 'Prescribed quantity updated successfully!' });
  } catch (error) {
    console.error('Error updating prescribed quantity:', error);
    return res.status(500).json({
      message: 'Server error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: String(error) // Add full string representation of error
      }
    });
  }
});
// Add a new visit with status ("new" or "old")
router.post('/:book_no/add-visit', async (req, res) => {
  try {
    const { book_no } = req.params;
    const { doctor_id } = req.body;

    if (!doctor_id) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const patientHistory = await PatientHistory.findOne({ book_no });
    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history not found' });
    }

    const newVisit = {
      doctor_id,
      timestamp: new Date().toISOString().slice(0, 7), // YYYY-MM
      medicines_prescribed: [],
      medicines_given: [],
      status: patientHistory.visits.length === 0 ? "new" : "old"
    };

    patientHistory.visits.push(newVisit);
    await patientHistory.save();

    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Created a new visit for patient (Book #${book_no}) - Status: ${newVisit.status}`
      );
    }

    return res.status(201).json({ message: 'Visit added successfully', visit: newVisit });
  } catch (error) {
    console.error('Error adding new visit:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:book_no/prescription/:medicine_id', async (req, res) => {
  try {
    const { book_no, medicine_id } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    if (!mongoose.Types.ObjectId.isValid(medicine_id)) {
      return res.status(400).json({ message: 'Invalid medicine ID format.' });
    }

    const updatedPatientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
      },
      {
        $pull: {
          'visits.$.medicines_prescribed': { _id: new mongoose.Types.ObjectId(medicine_id) },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedPatientHistory) {
      return res.status(404).json({ message: 'Patient history, visit, or medicine not found.' });
    }

    // Log the prescription deletion action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Deleted prescribed medicine (ID: ${medicine_id}) for patient (Book #${book_no})`
      );
    }

    return res.status(200).json({ message: 'Prescribed medicine deleted successfully!' });
  } catch (error) {
    console.error('Error deleting prescribed medicine:', error);
    return res.status(500).json({
      message: 'Server error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: String(error)
      }
    });
  }
});

router.post('/counselling', async (req, res) => {
  try {
    const { book_no } = req.body;

    if (!book_no) {
      return res.status(400).json({ message: 'Book number is required.' });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
      },
      {
        $set: { 'visits.$.counselling': true },
      },
      { new: true }
    );

    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history or current month visit not found for this book number.' });
    }

    // Log the counselling update action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Counselling status updated to true for patient (Book #${book_no}) for current month visit`
      );
    }

    return res.status(200).json({ message: 'Counselling status updated successfully!', patientHistory });
  } catch (error) {
    console.error('Error updating counselling status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// @desc    Check if a doctor is assigned for a given book number for the current month
// @route   GET /api/patient-history/check-doctor-assignment/:book_no
// @access  Private (Volunteer/Doctor/Admin)
router.get('/check-doctor-assignment/:book_no', async (req, res) => {
  try {
    const { book_no } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(200).json({ hasDoctorAssigned: false, message: 'Patient history not found.' });
    }

    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);

    if (!visit || !visit.doctor_id) {
      return res.status(200).json({ hasDoctorAssigned: false, message: 'No doctor assigned for the current month.' });
    }

    return res.status(200).json({ hasDoctorAssigned: true, message: 'Doctor assigned.' });
  } catch (error) {
    console.error('Error checking doctor assignment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get a summary of all patient histories for analytics
// @route   GET /api/patient-history/summary
// @access  Private (Admin)
router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query;
    let pipeline = [];

    if (month && month !== 'All') {
      pipeline.push({
        $match: {
          'visits.timestamp': month
        }
      });
      pipeline.push({
        $project: {
          book_no: 1,
          visits: {
            $filter: {
              input: '$visits',
              as: 'visit',
              cond: { $eq: ['$$visit.timestamp', month] }
            }
          }
        }
      });
    } else {
      // If no month filter, just select the necessary fields
      pipeline.push({
        $project: {
          book_no: 1,
          'visits.status': 1,
          'visits.counselling': 1,
          'visits.timestamp': 1,
          'visits.doctor_id': 1
        }
      });
    }

    const patientHistories = await PatientHistory.aggregate(pipeline);

    // Log the action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved summary of patient histories for analytics (${patientHistories.length} records) for month: ${month || 'All'}`
      );
    }

    return res.status(200).json(patientHistories);
  } catch (error) {
    console.error('Error fetching patient history summary:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
