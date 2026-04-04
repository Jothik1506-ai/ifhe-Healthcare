const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  doctor_id: { type: Number, required: true, unique: true },
  doctor_name: { type: String, required: true },
  doctor_age: { type: Number, required: false },
  doctor_sex: { type: String, required: false },
  specialization: { type: String, required: true },
  doctor_email: { type: String, required: false },
  doctor_phone_no: { type: String, required: true, unique: true },
  doctor_availability: { type: Boolean, required: true },
  patient_queue: [{
    book_no: { type: Number, required: true },
    patient_name: { type: String, required: true },
    queue_type: { type: String, enum: ["vitals", "consultation"], required: true },
    assigned_at: { type: Date, required: true, default: Date.now },
  }],
  list_of_visits: [{
    timestamp: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/ // Enforces YYYY-MM format
    },
  }]
});

const Doctor = mongoose.model('Doctor', DoctorSchema);

module.exports = Doctor;