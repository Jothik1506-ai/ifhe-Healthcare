const mongoose = require('mongoose');

const PatientHistorySchema = new mongoose.Schema({
  book_no: { type: String, required: true, unique: true },
  visits: [{
    doctor_id: { type: Number },
    timestamp: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/ // Enforces YYYY-MM format
    },
    visit_type: { type: String, default: "" },
    follow_up_type: { type: String, default: "" },
    chronic_history: { type: [String], default: [] },
    other_history: { type: String, default: "" },
    doctor_history: [{
      doctor_id: Number,
      assigned_at: { type: Date, default: Date.now }
    }],
    medicines_prescribed: [{
      medicine_id: String,
      quantity: Number,
      dosage_schedule: {
        days: Number,
        morning: Boolean,
        afternoon: Boolean,
        night: Boolean
      },
      status: {
        type: String,
        enum: ['prescribed', 'dispensed', 'replaced', 'buy_outside', 'out_of_stock'],
        default: 'prescribed'
      },
      replacement_medicine_id: String,
      replacement_quantity: Number,
      status_note: String
    }],
    medicines_given: [{ medicine_id: String, quantity: Number }],
    scan_station: {
      Entry: { type: Boolean, default: false },
      DoctorAssigning: { type: Boolean, default: false },
      Vitals: { type: Boolean, default: false },
      MedicinePrescribed: { type: Boolean, default: false },
      MedicineVerified: { type: Boolean, default: false },
      CounsellingDone: { type: Boolean, default: false },
      FoodCollected: { type: Boolean, default: false },
    }
  }],
});

const PatientHistory = mongoose.model('PatientHistory', PatientHistorySchema);

module.exports = PatientHistory;
