const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventoryModel');

router.get('/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;
    const inventory = await Inventory.findOne({ medicine_id: medicineId });
    if (!inventory) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({
      medicine_formulation: inventory.medicine_formulation,
      total_quantity: inventory.total_quantity, // Add total_quantity
      details: inventory.medicine_details.map(({ expiry_date, quantity }) => ({ // medicine_name is removed from model
        expiry_date,
        quantity
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
