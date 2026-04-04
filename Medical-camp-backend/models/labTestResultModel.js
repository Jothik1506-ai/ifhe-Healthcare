const mongoose = require('mongoose');

const labTestResultSchema = mongoose.Schema(
  {
    book_no: {
      type: String,
      required: true,
      unique: true, // Assuming book_no is unique for each lab test record
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient', // Reference to the Patient model
      required: false, // Making it optional for now, will clarify with user if needed
    },
    labTests: {
      type: [String], // Array of strings for selected lab tests
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LabTestResult', labTestResultSchema);
