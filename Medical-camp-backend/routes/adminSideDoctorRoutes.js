const moongoose = require('mongoose');
const express = require('express');

const router = express.Router();
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const Medicine = require('../models/inventoryModel');
const MedicineCategory = require('../models/medicineCategoryModel');

const { logUserAction } = require('../utils/logger');

router.post('/add_doctor', async (req, res) => {
    const { doctor_name, doctor_email, doctor_phone_no, doctor_age, specialization, doctor_sex } = req.body;
    
    try {
        // Check if the doctor already exists using phone number
        const existingDoctor = await Doctor.findOne({ doctor_phone_no });
        if (existingDoctor) {
            return res.status(400).send('Doctor with this phone number already exists');
        }
        
        // Only check for duplicate email if a non-empty email was provided
        if(doctor_email && doctor_email.trim() !== ''){
            const existingDoctor1 = await Doctor.findOne({ doctor_email });
            if (existingDoctor1) {
                return res.status(400).send('Doctor with this email already exists');
            }
        }

        const doctors = await Doctor.find();
        let doctor_id = 1;

        while (doctors.find((doctor) => doctor.doctor_id === doctor_id)) {
            doctor_id++;
        }

        // Set email to null if it's empty or not provided
        const sanitizedEmail = (doctor_email && doctor_email.trim() !== '') 
            ? doctor_email.trim() 
            : null;

        const doctor = new Doctor({
            'doctor_id': doctor_id,
            'doctor_name': doctor_name,
            'doctor_email': sanitizedEmail,
            'doctor_age': doctor_age,
            'doctor_phone_no': doctor_phone_no,
            'specialization': specialization,
            'doctor_sex': doctor_sex,
            'doctor_availability': false
        });

        await doctor.save();
        
        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Added new doctor: ${doctor_name} (ID: ${doctor_id})`);
        }
        
        return res.send(doctor);
    } catch (error) {
        console.log(error);
        return res.status(500).send('Error while adding a doctor');
    }
});

router.delete('/delete_doctor/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findByIdAndDelete(id);
        
        if (!doctor) {
            return res.status(404).send('Doctor not found');
        }
        
        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Deleted doctor: ${doctor.doctor_name} (ID: ${doctor.doctor_id})`);
        }
        
        return res.send(doctor);
    } catch (error) {
        console.error('Error deleting doctor:', error);
        return res.status(500).send('Server error');
    }
});

router.put('/update_doctor_availability/:id', async (req, res) => {
    const { id } = req.params;
    const { doctor_availability } = req.body;

    try {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Update availability
        doctor.doctor_availability = doctor_availability;

        // If marking as available, append the current month and year to list_of_visits
        if (doctor_availability) {
            const currentTimestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
            if (!doctor.list_of_visits.some(visit => visit.timestamp === currentTimestamp)) {
                doctor.list_of_visits.push({ timestamp: currentTimestamp });
            }
        }

        await doctor.save();
        
        // Log the action
        if (req._user && req._user.id) {
            const statusText = doctor_availability ? "Available" : "Unavailable";
            await logUserAction(req._user.id, `Updated doctor availability: ${doctor.doctor_name} set to ${statusText}`);
        }
        
        return res.status(200).json(doctor);
    } catch (error) {
        console.error('Error updating doctor availability:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get_doctors', async (req, res) => {
    try {
        const { month } = req.query;
        let query = {};

        if (month && month !== 'All') {
            query['list_of_visits.timestamp'] = month;
        }

        const doctors = await Doctor.find(query);
        
        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Retrieved list of doctors (count: ${doctors.length}) for month: ${month || 'All'}`);
        }
        
        return res.json(doctors);
    } catch (error) {
        console.error(error);
        
        // Log the error
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Error retrieving doctors for month ${req.query.month || 'All'}: ${error.message}`);
        }
        
        return res.status(500).send('Error retrieving doctors');
    }
});

router.get('/get_doctor/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const doctor = await Doctor.findById(id);
        if (doctor) {
            // Log the action
            if (req._user && req._user.id) {
                await logUserAction(req._user.id, `Viewed doctor details: ${doctor.doctor_name}`);
            }
            
            return res.status(200).json(doctor);
        } else {
            return res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        console.error('Error fetching doctor details:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.put('/edit_doctor/:id', async (req, res) => {
    try {
        console.log("Got edit doctor request");
        console.log(req.body);
        const id = req.params.id;
        
        // Find the doctor by ID
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        
        // Store the original values for logging changes
        const originalValues = {
            doctor_name: doctor.doctor_name,
            doctor_email: doctor.doctor_email,
            doctor_age: doctor.doctor_age,
            doctor_phone_no: doctor.doctor_phone_no,
            specialization: doctor.specialization,
            doctor_sex: doctor.doctor_sex
        };
        
        // Update fields from the request body
        if (req.body.doctor_name) doctor.doctor_name = req.body.doctor_name;
        if (req.body.doctor_email !== undefined) doctor.doctor_email = req.body.doctor_email;
        if (req.body.doctor_age !== undefined) doctor.doctor_age = req.body.doctor_age;
        if (req.body.doctor_phone_no) doctor.doctor_phone_no = req.body.doctor_phone_no;
        if (req.body.specialization) doctor.specialization = req.body.specialization;
        if (req.body.doctor_sex) doctor.doctor_sex = req.body.doctor_sex;
        
        // Save the updated doctor record
        await doctor.save();
        
        // Log the action with details of what was changed
        if (req._user && req._user.id) {
            let changesDescription = [];
            
            if (originalValues.doctor_name !== doctor.doctor_name) 
                changesDescription.push(`name from "${originalValues.doctor_name}" to "${doctor.doctor_name}"`);
            
            if (originalValues.doctor_email !== doctor.doctor_email) 
                changesDescription.push(`email from "${originalValues.doctor_email}" to "${doctor.doctor_email}"`);
            
            if (originalValues.doctor_age !== doctor.doctor_age) 
                changesDescription.push(`age from "${originalValues.doctor_age}" to "${doctor.doctor_age}"`);
            
            if (originalValues.doctor_phone_no !== doctor.doctor_phone_no) 
                changesDescription.push(`phone from "${originalValues.doctor_phone_no}" to "${doctor.doctor_phone_no}"`);
            
            if (originalValues.specialization !== doctor.specialization) 
                changesDescription.push(`specialization from "${originalValues.specialization}" to "${doctor.specialization}"`);
            
            if (originalValues.doctor_sex !== doctor.doctor_sex) 
                changesDescription.push(`sex from "${originalValues.doctor_sex}" to "${doctor.doctor_sex}"`);
            
            const changesText = changesDescription.length ? 
                ` - Changed: ${changesDescription.join(', ')}` : 
                ` - No fields changed`;
                
            await logUserAction(req._user.id, `Updated doctor: ${doctor.doctor_name} (ID: ${doctor.doctor_id})${changesText}`);
        }
        
        // Return the updated doctor
        return res.status(200).json(doctor);
    } catch (error) {
        console.error("Error updating doctor:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/doctor_analytics/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Extract the list of visits and count the number of visits
        const visits = doctor.list_of_visits || [];
        const visitCount = visits.length;

        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Viewed analytics for doctor: ${doctor.doctor_name}`);
        }

        return res.status(200).json({ visits, visitCount });
    } catch (error) {
        console.error('Error fetching doctor analytics:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
);

module.exports = router;
