require('mongoose').connect('mongodb://localhost:27017/medical_camp').then(async () => {
    const User = require('./models/userModel');
    const admin = await User.findOne({ user_type: 'admin' });
    const vol = await User.findOne({ user_type: 'volunteer' });
    console.log('Admin:', admin);
    console.log('Volunteer:', vol);
    process.exit(0);
}).catch(console.error);
