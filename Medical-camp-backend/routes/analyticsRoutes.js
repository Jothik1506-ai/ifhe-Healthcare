const express = require('express');
const router = express.Router();
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const Vitals = require('../models/vitalsModel');
const Doctor = require('../models/doctorModel');
const Inventory = require('../models/inventoryModel');
const { logUserAction } = require('../utils/logger');

router.get('/today', async (req, res) => {
    try {
        const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

        // 1. Total Patients (registered this month)
        const totalPatients = await PatientHistory.countDocuments({
            'visits.timestamp': currentMonthYear
        });

        // 1b. Repeat Medicine Patients (this month)
        const repeatMedicineHistory = await PatientHistory.aggregate([
            { $unwind: "$visits" },
            {
                $match: {
                    "visits.timestamp": currentMonthYear,
                    "visits.visit_type": "Follow-up Visit",
                    "visits.follow_up_type": "Repeat Medicine"
                }
            },
            {
                $lookup: {
                    from: "patients",
                    localField: "book_no",
                    foreignField: "book_no",
                    as: "patientInfo"
                }
            },
            { $unwind: "$patientInfo" },
            {
                $project: {
                    book_no: 1,
                    patient_name: "$patientInfo.patient_name"
                }
            }
        ]);

        // 2. Vitals Recorded (this month)
        const vitalsRecorded = await Vitals.countDocuments({
            timestamp: currentMonthYear
        });

        // 3. Active Consultations (currently in consultation queue)
        const doctors = await Doctor.find({});
        let activeConsultations = 0;
        doctors.forEach(doc => {
            activeConsultations += doc.patient_queue.filter(
                q => q.queue_type === 'consultation'
            ).length;
        });

        // 4. Get all patient histories for this month
        const patientHistories = await PatientHistory.find({
            'visits.timestamp': currentMonthYear
        });

        // 5. Completed Consultations (patients who have received prescriptions)
        // A consultation is considered complete when the doctor has prescribed medicines
        let completedConsultations = 0;
        patientHistories.forEach(ph => {
            const visit = ph.visits.find(v => v.timestamp === currentMonthYear);
            if (visit && visit.medicines_prescribed && visit.medicines_prescribed.length > 0) {
                completedConsultations++;
            }
        });

        // 6. Prescriptions Generated (this month)
        let prescriptionsGenerated = 0;
        patientHistories.forEach(ph => {
            const visit = ph.visits.find(v => v.timestamp === currentMonthYear);
            if (visit && visit.medicines_prescribed) {
                prescriptionsGenerated += visit.medicines_prescribed.length;
            }
        });

        // 7. Medicines Received (unique patients who received medicines this month)
        let medicinesReceived = 0;
        patientHistories.forEach(ph => {
            const visit = ph.visits.find(v => v.timestamp === currentMonthYear);
            if (visit && visit.medicines_given && visit.medicines_given.length > 0) {
                medicinesReceived++;
            }
        });

        // 8. Dispensed Medicines (aggregate by medicine_id)
        const allMedicines = await Inventory.find({});
        const dispensedMedicines = {};

        // Initialize with all medicines
        allMedicines.forEach(med => {
            dispensedMedicines[med.medicine_id] = {
                totalQuantity: med.total_quantity,
                dispensedQuantity: 0
            };
        });

        // Calculate dispensed quantities from patient histories
        patientHistories.forEach(ph => {
            const visit = ph.visits.find(v => v.timestamp === currentMonthYear);
            if (visit && visit.medicines_given && visit.medicines_given.length > 0) {
                visit.medicines_given.forEach(med => {
                    if (dispensedMedicines[med.medicine_id]) {
                        dispensedMedicines[med.medicine_id].dispensedQuantity += med.quantity;
                    } else {
                        // Medicine exists in history but not in inventory (shouldn't happen, but handle it)
                        dispensedMedicines[med.medicine_id] = {
                            totalQuantity: 0,
                            dispensedQuantity: med.quantity
                        };
                    }
                });
            }
        });

        // Filter to only show dispensed medicines (dispensedQuantity > 0)
        const filteredDispensed = {};
        Object.keys(dispensedMedicines).forEach(medId => {
            if (dispensedMedicines[medId].dispensedQuantity > 0) {
                filteredDispensed[medId] = dispensedMedicines[medId];
            }
        });

        // Log the analytics retrieval
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Retrieved today's analytics - Patients: ${totalPatients}, Vitals: ${vitalsRecorded}, Active Consultations: ${activeConsultations}`
            );
        }

        return res.json({
            totalPatients,
            vitalsRecorded,
            activeConsultations,
            completedConsultations,
            prescriptionsGenerated,
            medicinesReceived,
            medicinesReceived,
            dispensedMedicines: filteredDispensed,
            repeatMedicinePatients: repeatMedicineHistory || []
        });
    } catch (error) {
        console.error('Error fetching today\'s analytics:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
