const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const { logUserAction } = require('../utils/logger');
const bcrypt = require('bcryptjs'); // Make sure to install: npm install bcryptjs
const { sendOtpRequest, generateOtp } = require('../utils/createOtp');
/**
 * @route   POST /api/admin/add_volunteer
 * @desc    Create a new volunteer
 * @access  Admin
 */
router.post('/add_volunteer', async (req, res) => {
    const verifyOtp = req.query.verifyOtp;
    try {
        const {
            user_name,
            user_phone_no,
            user_email,
            user_age,
            user_password
        } = req.body;

        // Check if required fields are provided
        if (!user_name || !user_password || !user_phone_no || !user_email || !user_age) {
            return res.status(400).json({
                message: 'All fields are required: username, password, phone number, email, and age'
            });
        }

        // Validate email format
        if (!/\S+@\S+\.\S+/.test(user_email)) {
            return res.status(400).json({ message: 'Email format is invalid' });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ user_name }, { user_email }]
        });

        if (existingUser) {
            if (existingUser.user_name === user_name) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingUser.user_email === user_email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Generate auto-incremented user_id
        // Find the highest user_id and increment by 1
        const highestUser = await User.findOne().sort('-user_id');
        const nextUserId = highestUser ? highestUser.user_id + 1 : 1;

        // Create new volunteer user with plain password
        const newVolunteer = new User({
            user_id: nextUserId,
            user_name,
            user_phone_no,
            user_email,
            user_age,
            user_password, // Store password directly without hashing
            user_type: 'volunteer',
            list_of_visits: [] // Initialize with empty visits array
        });

        if (verifyOtp) {
            const otp = generateOtp();
            const otpResult = await sendOtpRequest(otp, user_phone_no);
            // const otpResult = { success: true }; // Mock successful SMS response

            if (otpResult && otpResult.success) {
                // Remove any existing OTPs for this user
                await OTP.deleteMany({ user_id: nextUserId });

                // Create new OTP document with TTL
                const otpModel = new OTP({
                    user_id: nextUserId,
                    otp: otp,
                    phone_number: user_phone_no,
                    createdAt: new Date(),
                    isUsed: false
                });
                await otpModel.save();

                console.log(`OTP ${otp} sent to ${user_phone_no} for user ${nextUserId}`);
            } else {
                return res.status(500).json({
                    message: 'Failed to send OTP',
                    error: otpResult ? otpResult.message : 'SMS service unavailable'
                });
            }
        }

        await newVolunteer.save();

        // Log successful volunteer creation
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Added new volunteer: ${user_name} (ID: ${nextUserId}, Email: ${user_email})`
            );
        }

        // Return success without sending back the password
        const volunteerResponse = newVolunteer.toObject();
        delete volunteerResponse.user_password;

        return res.status(201).json({
            message: 'Volunteer created successfully',
            volunteer: volunteerResponse
        });
    } catch (error) {
        console.error('Error adding volunteer:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   GET /api/admin/get_volunteers
 * @desc    Get all volunteers
 * @access  Admin
 */
router.get('/get_volunteers', async (req, res) => {
    try {
        const volunteers = await User.find({ user_type: 'volunteer' })
            .select('-user_password') // Exclude password from results
            .sort('user_id'); // Sort by user_id

        // Log successful retrieval
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Retrieved list of all volunteers (${volunteers.length} records)`
            );
        }

        return res.status(200).json(volunteers);
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        return res.status(500).json({ message: 'Error retrieving volunteers', error: error.message });
    }
});

/**
 * @route   GET /api/admin/get_volunteer/:id
 * @desc    Get a specific volunteer by ID
 * @access  Admin
 */
router.get('/get_volunteer/:id', async (req, res) => {
    try {
        const volunteer = await User.findById(req.params.id); // Remove select('-user_password')

        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        if (volunteer.user_type !== 'volunteer') {
            return res.status(400).json({ message: 'User is not a volunteer' });
        }

        // Log successful retrieval
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Retrieved volunteer details: ${volunteer.user_name} (ID: ${volunteer.user_id})`
            );
        }

        return res.status(200).json(volunteer);
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        return res.status(500).json({ message: 'Error retrieving volunteer', error: error.message });
    }
});

/**
 * @route   POST /api/admin/delete_volunteers
 * @desc    Delete multiple volunteers
 * @access  Admin
 */
router.post('/delete_volunteers', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Valid volunteer IDs array is required' });
        }

        // Get volunteer info before deleting for logging purposes
        const volunteersToDelete = await User.find({
            _id: { $in: ids },
            user_type: 'volunteer'
        }).select('user_name user_id');

        const result = await User.deleteMany({
            _id: { $in: ids },
            user_type: 'volunteer'
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No volunteers found with the provided IDs' });
        }

        // Log successful bulk deletion
        if (req._user && req._user.id) {
            const volunteerNames = volunteersToDelete.map(v => `${v.user_name} (ID: ${v.user_id})`).join(', ');
            await logUserAction(
                req._user.id,
                `Deleted ${result.deletedCount} volunteers: ${volunteerNames}`
            );
        }

        return res.status(200).json({
            message: `${result.deletedCount} volunteers deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting volunteers:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   POST /api/admin/delete_volunteer/:id
 * @desc    Delete a specific volunteer
 * @access  Admin
 */
router.post('/delete_volunteer/:id', async (req, res) => {
    try {
        const volunteer = await User.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        if (volunteer.user_type !== 'volunteer') {
            return res.status(400).json({ message: 'User is not a volunteer' });
        }

        const volunteerName = volunteer.user_name;
        const volunteerId = volunteer.user_id;

        await User.findByIdAndDelete(req.params.id);

        // Log successful deletion
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Deleted volunteer: ${volunteerName} (ID: ${volunteerId})`
            );
        }

        return res.status(200).json({ message: 'Volunteer deleted successfully' });
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   POST /api/admin/edit_volunteer/:id
 * @desc    Update a volunteer's information
 * @access  Admin
 */
router.post('/edit_volunteer/:id', async (req, res) => {
    try {
        const volunteer = await User.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        if (volunteer.user_type !== 'volunteer') {
            return res.status(400).json({ message: 'User is not a volunteer' });
        }

        // Store original values for logging changes
        const originalValues = {
            user_name: volunteer.user_name,
            user_phone_no: volunteer.user_phone_no,
            user_email: volunteer.user_email,
            user_age: volunteer.user_age
        };

        // Fields that can be updated
        const { user_name, user_phone_no, user_email, user_age, user_password } = req.body;

        // Check if email exists if trying to change it
        if (user_email && user_email !== volunteer.user_email) {
            const existingUser = await User.findOne({ user_email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Check if username exists if trying to change it
        if (user_name && user_name !== volunteer.user_name) {
            const existingUser = await User.findOne({ user_name });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        // Update only provided fields
        if (user_name) volunteer.user_name = user_name;
        if (user_phone_no) volunteer.user_phone_no = user_phone_no;
        if (user_email) volunteer.user_email = user_email;
        if (user_age) volunteer.user_age = user_age;

        // Update password directly without hashing
        if (user_password) {
            volunteer.user_password = user_password;
        }

        // Save updated volunteer
        await volunteer.save();

        // Prepare log message showing what changed
        let changesDescription = [];

        if (originalValues.user_name !== volunteer.user_name)
            changesDescription.push(`username from "${originalValues.user_name}" to "${volunteer.user_name}"`);

        if (originalValues.user_email !== volunteer.user_email)
            changesDescription.push(`email from "${originalValues.user_email}" to "${volunteer.user_email}"`);

        if (originalValues.user_age !== volunteer.user_age)
            changesDescription.push(`age from "${originalValues.user_age}" to "${volunteer.user_age}"`);

        if (originalValues.user_phone_no !== volunteer.user_phone_no)
            changesDescription.push(`phone from "${originalValues.user_phone_no}" to "${volunteer.user_phone_no}"`);

        if (user_password)
            changesDescription.push(`password was updated`);

        // Log successful update with specific changes
        if (req._user && req._user.id) {
            const changesText = changesDescription.length ?
                ` - Changed: ${changesDescription.join(', ')}` :
                ` - No fields changed`;

            await logUserAction(
                req._user.id,
                `Updated volunteer: ${volunteer.user_name} (ID: ${volunteer.user_id})${changesText}`
            );
        }

        // Return updated volunteer without password
        const volunteerResponse = volunteer.toObject();
        delete volunteerResponse.user_password;

        return res.status(200).json({
            message: 'Volunteer updated successfully',
            volunteer: volunteerResponse
        });
    } catch (error) {
        console.error('Error updating volunteer:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   GET /api/admin/volunteer_analytics/:id
 * @desc    Get analytics for a specific volunteer
 * @access  Admin
 */
router.get('/volunteer_analytics/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const volunteer = await User.findById(id);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        if (volunteer.user_type !== 'volunteer') {
            return res.status(400).json({ message: 'User is not a volunteer' });
        }

        // Extract the list of visits and count the number of visits
        const visits = volunteer.list_of_visits || [];
        const visitCount = visits.length;

        // Log the action
        if (req._user && req._user.id) {
            await logUserAction(req._user.id, `Viewed analytics for volunteer: ${volunteer.user_name}`);
        }

        return res.status(200).json({ visits, visitCount });
    } catch (error) {
        console.error('Error fetching volunteer analytics:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/admin/verify-volunteer-otp
 * @desc    Verify OTP for a volunteer
 * @access  Admin
 */
router.post('/verify-otp', async (req, res) => {
    const { phone_no, otp, user_id } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ user_id: user_id, user_phone_no: phone_no });
        if (!user) {
            return res.status(404).json({ message: 'Volunteer not found' });
        }

        // Find the OTP document
        const otpDoc = await OTP.findOne({
            phone_number: phone_no,
            user_id: user_id,
            otp: otp,
            isUsed: false
        });

        if (!otpDoc) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if OTP is expired (additional check)
        const now = new Date();
        const otpAge = now - otpDoc.createdAt;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (otpAge > fiveMinutes) {
            // Mark as used and delete
            await OTP.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Mark OTP as used
        otpDoc.isUsed = true;
        await otpDoc.save();

        // Delete the OTP document
        await OTP.deleteOne({ _id: otpDoc._id });

        // Log successful OTP verification
        if (req._user && req._user.id) {
            await logUserAction(
                req._user.id,
                `Verified OTP for volunteer: ${user.user_name} (ID: ${user_id})`
            );
        }

        return res.status(200).json({
            message: 'OTP verified successfully',
            user: {
                id: user._id,
                user_id: user.user_id,
                user_name: user.user_name,
                user_type: user.user_type
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;