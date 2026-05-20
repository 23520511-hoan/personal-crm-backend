require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { startReminderJob } = require('./utils/reminderJob');

// 1. Connect to Database
connectDB();

// 2. Khởi động Cron Job kiểm tra Reminder
startReminderJob();

// 2. Khởi tạo app
const app = express();

// 3. Middleware cơ bản
app.use(cors());
app.use(express.json());

// 4. --- CẤU HÌNH SWAGGER --- (Phải đặt SAU khi khởi tạo app)
const swaggerPath = path.join(__dirname, '../swagger.yaml'); 
const swaggerDocument = YAML.load(swaggerPath);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 5. LẮP CAMERA THEO DÕI
app.use((req, res, next) => {
  console.log(`🚀 [CÓ TÍN HIỆU ĐẾN]: ${req.method} ${req.originalUrl}`);
  next();
});

// 6. CÁC ROUTES CỦA API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/statuses', require('./routes/statusRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// 7. Basic route to test
app.get('/', (req, res) => {
  res.send('Personal CRM API is running...');
});

// 8. Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`📚 Tài liệu Swagger API tại: http://localhost:${PORT}/api-docs`);
});