const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // You can add other fields here if needed, e.g., description, normal_range, etc.
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const LabTest = mongoose.model('LabTest', LabTestSchema);

module.exports = LabTest;
