const moongoose = require('mongoose');
const express = require('express');
const { logUserAction } = require('../utils/logger');

const router = express.Router();
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const User = require('../models/userModel');
const Medicine = require('../models/inventoryModel');
const MedicineCategory = require('../models/medicineCategoryModel');
const Vitals = require('../models/vitalsModel');

router.get('/get_patients', async (req, res) => {
    try {
        const { month } = req.query;
        let query = {};

        if (month && month !== 'All') {
            // Find patient histories for the given month
            const patientHistoriesInMonth = await PatientHistory.find({
                'visits': {
                    $elemMatch: {
                        timestamp: month
                    }
                }
            }).select('book_no');

            const bookNosInMonth = patientHistoriesInMonth.map(history => history.book_no);
            query.book_no = { $in: bookNosInMonth };
        }

        const patients = await Patient.find(query);
        
        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Retrieved list of patients (count: ${patients.length}) for month: ${month || 'All'}`);
        }
        
        return res.json(patients);
    } catch (error) {
        console.error(error);
        
        // Log the error
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Error retrieving patients for month ${req.query.month || 'All'}: ${error.message}`);
        }
        
        return res.status(500).send('Error retrieving patients');
    }
});

router.get('/get_volunteers', async (req, res) => {
    try {
        const volunteers = await User.find({ user_type: 'volunteer' });
        
        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Retrieved list of all volunteers (count: ${volunteers.length})`);
        }
        
        return res.json(volunteers);
    } catch (error) {
        console.error(error);
        
        // Log the error
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Error retrieving volunteers: ${error.message}`);
        }
        
        return res.status(500).send('Error retrieving volunteers');
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const { monthYear } = req.query;
        console.log('Received request for analytics with monthYear:', monthYear);

        if (!monthYear) {
            // Log the validation error
            if (req._user && req._user.id) {
                await logUserAction(req._user.id, `Analytics request failed: Month and year are required`);
            }
            
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const patientHistories = await PatientHistory.find({
            'visits': {
                $elemMatch: {
                    timestamp: {
                        $regex: `^${monthYear}`
                    }
                }
            }
        });

        const uniqueBookNos = [...new Set(patientHistories.map(history => history.book_no))];
        
        const patients = await Patient.find({
            book_no: { $in: uniqueBookNos }
        });

        const genderCount = {
            male: 0,
            female: 0
        };

        const ageGroups = {
            'under18': 0,
            '18-30': 0,
            '30-45': 0,
            '45-60': 0,
            'above60': 0
        };

        patients.forEach(patient => {
            if (patient.patient_sex.toLowerCase() === 'male') {
                genderCount.male++;
            } else if (patient.patient_sex.toLowerCase() === 'female') {
                genderCount.female++;
            }

            const age = parseInt(patient.patient_age);
            if (age < 18) ageGroups.under18++;
            else if (age >= 18 && age < 30) ageGroups['18-30']++;
            else if (age >= 30 && age < 45) ageGroups['30-45']++;
            else if (age >= 45 && age < 60) ageGroups['45-60']++;
            else ageGroups.above60++;
        });

        const analyticsData = {
            genderCount,
            ageGroups,
            totalPatients: patients.length
        };

        // Log the successful analytics request
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Retrieved analytics data for period ${monthYear} (${patients.length} patients)`);
        }

        return res.json(analyticsData);

    } catch (error) {
        console.error('Error in analytics route:', error);
        
        // Log the error
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Error retrieving analytics for ${req.query.monthYear}: ${error.message}`);
        }
        
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/get_patient/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await Patient.findById(id);
        if (patient) {
            // Log the action
            if (req._user && req._user.id) {
                await logUserAction(req._user.id, `Viewed patient details: ${patient.patient_name}`);
            }
            
            return res.status(200).json(patient);
        } else {
            return res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
);

router.post('/delete_patient/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await Patient.findByIdAndDelete(id);
        if (patient) {
            // Log the action
            if (req._user && req._user.id) {
                await logUserAction(req._user.id, `Deleted patient: ${patient.patient_name}`);
            }
            
            return res.status(200).json({ message: 'Patient deleted successfully' });
        } else {
            return res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error deleting patient:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
);

router.post('/edit_patient/:id', async (req, res) => {
    const { id } = req.params;
    const { patient_name, patient_age, patient_sex, patient_address, patient_phone_no } = req.body;

    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Update patient details
        if (patient_name) patient.patient_name = patient_name;
        if (patient_age) patient.patient_age = patient_age;
        if (patient_sex) patient.patient_sex = patient_sex;
        if (patient_address) patient.patient_address = patient_address;
        if (patient_phone_no) patient.patient_phone_no = patient_phone_no;

        await patient.save();

        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Edited patient details: ${patient.patient_name}`);
        }

        return res.status(200).json({ message: 'Patient details updated successfully', patient });
    } catch (error) {
        console.error('Error editing patient details:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/patient_analytics/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const patient = await Patient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Get the patient history to count visits
        const patientHistory = await PatientHistory.findOne({ book_no: patient.book_no });
        const visitCount = patientHistory ? patientHistory.visits.length : 0;

        // Get vitals data for the past 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const vitals = await Vitals.find({ 
            book_no: patient.book_no,
            timestamp: {
                $gte: sixMonthsAgo.toISOString().slice(0, 7)
            }
        }).sort('timestamp');

        // Process BP data
        const bpData = vitals.map(record => {
            let systolic = null;
            let diastolic = null;

            if (record.bp) {
                const [sys, dia] = record.bp.split('/').map(num => parseInt(num.trim()));
                systolic = sys;
                diastolic = dia;
            }

            return {
                timestamp: record.timestamp,
                systolic,
                diastolic
            };
        }).filter(record => record.systolic && record.diastolic); // Remove invalid readings

        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Viewed analytics for patient: ${patient.patient_name}`);
        }

        return res.status(200).json({ visitCount, bpData });
    } catch (error) {
        console.error('Error fetching patient analytics:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/user/:userId' , async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
    }   
})

module.exports = router;
