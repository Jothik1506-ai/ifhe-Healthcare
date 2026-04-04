const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    medicine_id: { type: String, required: true, unique: true },
    medicine_formulation: { type: String, required: true },
    total_quantity: { type: Number, required: true },
    medicine_details: [{
      expiry_date: { type: Date, required: true },
      quantity: { type: Number, required: true },
    }],
  });
  
const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;
