const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User'); // You need a User model for login

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB - Replace this with your MongoDB connection string
mongoose.connect('YOUR_MONGO_CONNECTION_STRING', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// **************** User Login API ***************
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Missing credentials or role' });
  }

  try {
    // Find user by username and role
    const user = await User.findOne({ username, role });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // For simplicity, plain text password comparison (use hashing in production)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Return user data (adjust fields as needed)
    res.json({ success: true, role: user.role, rollNo: user.rollNo, name: user.name });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error in login' });
  }
});

// **************** Attendance Save API ***************
app.post('/api/attendance', async (req, res) => {
  const { date, year, section, attendance } = req.body;

  if (!date || !year || !section || !attendance) {
    return res.status(400).json({ success: false, message: 'Missing attendance data' });
  }

  try {
    await Attendance.findOneAndDelete({ date, year, section }); // Remove old record if exists

    const newAttendance = new Attendance({ date, year, section, attendance });
    await newAttendance.save();

    res.json({ success: true, message: 'Attendance saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving attendance' });
  }
});

// **************** Attendance Records Query API ***************
app.get('/api/attendanceRecords', async (req, res) => {
  try {
    const { year, section, rollNo } = req.query;
    let filter = {};
    if (year) filter.year = year;
    if (section) filter.section = section;

    const records = await Attendance.find(filter).lean();
    const filtered = rollNo ? records.filter(r => r.attendance.hasOwnProperty(rollNo)) : records;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching attendance records' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
