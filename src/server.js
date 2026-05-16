require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// LẮP CAMERA THEO DÕI: Bất cứ cái gì gọi vào port 5000 đều phải in ra đây
app.use((req, res, next) => {
  console.log(`🚀 [CÓ TÍN HIỆU ĐẾN]: ${req.method} ${req.originalUrl}`);
  next();
});

// CÁC ROUTES CỦA API
app.use('/api/auth', require('./routes/authRoutes'));
// ... (giữ nguyên mớ ở dưới)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/statuses', require('./routes/statusRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // Đã gom gọn gàng vào đây
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // CHỐT SỔ!

// Basic route to test
app.get('/', (req, res) => {
  res.send('Personal CRM API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});