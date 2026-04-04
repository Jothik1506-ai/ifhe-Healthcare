require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');

require('./models/userModel');
require('./models/patientModel');
require('./models/medicineCategoryModel');
require('./models/inventoryModel');
require('./models/patientHistoryModel');
require('./models/vitalsModel');
require('./models/doctorModel');
require('./models/labTestResultModel');
require('./models/patientFoodModel');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

const patientRoutes = require('./routes/patientRoutes');
const vitalRoutes = require('./routes/vitalRoutes');
const patientHistoryRoutes = require('./routes/patientHistoryRoutes');
const doctorAssignRoutes = require('./routes/doctorAssignRoutes');
const adminSideGeneralRoutes = require('./routes/adminSideGeneralRoutes');
const adminSideMedicineRoutes = require('./routes/adminSideMedicineRoutes');
const adminSideDoctorRoutes = require('./routes/adminSideDoctorRoutes');
const adminSideVolunteerRoutes = require('./routes/adminSideVolunteerRoutes');
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/token');
const patientStatusRoutes = require('./routes/patientStatusRoutes'); // New route
const labTestRoutes = require('./routes/labTestRoutes'); // New route
const adminLabTestRoutes = require('./routes/adminLabTestRoutes'); // New admin route for lab tests
const analyticsRoutes = require('./routes/analyticsRoutes'); // Analytics route

const app = express();

// Shared CORS configuration
// const corsOptions = {
//   origin: 'https://localhost', // Frontend URL
//   // origin: 'https://medical-camp.apps.swecha.org', // Production URL
//   credentials: true
// };
const corsOptions = {
  origin: true, // Echo back the exact origin of the request, allowing all local testing
  credentials: true
};

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with shared CORS config
const io = socketIo(server, {
  cors: corsOptions
});

// Make io accessible to routes
app.set('io', io);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join analytics room for real-time updates
  socket.on('join:analytics', () => {
    socket.join('analytics');
    console.log(`Socket ${socket.id} joined analytics room`);
  });

  // Join queue room for real-time updates
  socket.on('join:queue', () => {
    socket.join('queue');
    console.log(`Socket ${socket.id} joined queue room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Apply middleware
app.use(express.json());
app.use(cors(corsOptions)); // Use shared CORS config

app.use(authMiddleware); // Apply logging middleware to all routes, to log all actions

connectDB();

app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/patient-history', patientHistoryRoutes);
app.use('/api/doctor-assign', doctorAssignRoutes);
app.use('/api/admin', adminSideGeneralRoutes);
app.use('/api/admin', adminSideMedicineRoutes);
app.use('/api/admin', adminSideDoctorRoutes);
app.use('/api/admin', adminSideVolunteerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api', tokenRoutes);
app.use('/api/patient-status', patientStatusRoutes); // Register new route
app.use('/api/labtests', labTestRoutes); // Register new route
app.use('/api/admin/labtests', adminLabTestRoutes); // Register new admin lab test route
app.use('/api/analytics', analyticsRoutes); // Register analytics route

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
