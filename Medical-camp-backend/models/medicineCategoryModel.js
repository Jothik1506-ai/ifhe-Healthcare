const mongoose = require('mongoose');

const MedicineCategorySchema = new mongoose.Schema({
    category_name: { type: String, required: true },
    medicine_array: [{
      medicine_id: { type: String, required: true },
    }],
  });
  
const MedicineCategory = mongoose.model('MedicineCategory', MedicineCategorySchema);

module.exports = MedicineCategory;