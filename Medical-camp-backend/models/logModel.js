const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    action: { type: String, required: true },
    timestamp: { 
        type: String, 
        required: true, 
        match: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/ // Enforces YYYY-MM-DD HH:MM format in 24-hour time
    }
});

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;