const mongoose = require('mongoose');
const Token = require("../models/token");
const router = require("express").Router();

const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getNextToken = async (gender) => {
  const startOfToday = getStartOfToday();

  const lastToken = await Token.findOne({
    createdAt: { $gte: startOfToday },
    gender: gender
  }).sort({ createdAt: -1 });

  const lastTokenNumber = lastToken ? parseInt(lastToken.tokenNumber) : 0;
  return lastTokenNumber + 1;
};

// 🎯 POST /api/token
router.post('/token', async (req, res) => {
  const { bookNumber, gender } = req.body;

  if (!bookNumber || !gender) {
    return res.status(400).json({ error: 'bookNumber and gender are required' });
  }

  try {
    const startOfToday = getStartOfToday();

    // 🔍 Check if token already exists today for this bookNumber
    const existingToken = await Token.findOne({
      bookNumber,
      createdAt: { $gte: startOfToday }
    });

    if (existingToken) {
      return res.json({
        tokenNumber: existingToken.tokenNumber,
        bookNumber: existingToken.bookNumber,
        gender: existingToken.gender,
        alreadyExists: true
      });
    }

    // ➕ Generate new token
    const tokenNumber = await getNextToken(gender);

    const newToken = new Token({
      bookNumber,
      gender,
      tokenNumber
    });

    await newToken.save();

    res.json({ tokenNumber, bookNumber, gender });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
