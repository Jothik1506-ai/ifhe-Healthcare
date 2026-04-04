const mongoose = require('mongoose');

const patientSupportSchema = new mongoose.Schema({
  book_no: {
    type: Number,
    required: true,
    ref: 'Patient', // Reference to the Patient model
  },
  volunteer_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Assuming 'User' is the model for volunteers
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const PatientSupport = mongoose.model('PatientSupport', patientSupportSchema);

module.exports = PatientSupport;
