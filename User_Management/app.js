const express = require('express');
const mongoose = require('mongoose');
const nocache = require('nocache');
const path = require('path');
const session = require('express-session');
const config = require('./config/config');

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/user_management_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middlewares
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (consolidated here to avoid duplicate sessions)
app.use(session({
  secret: config.sessionSecret || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');

// Middleware to switch view paths dynamically
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    app.set('views', path.join(__dirname, './views/admin'));
  } else {
    app.set('views', path.join(__dirname, './views/user'));
  }
  next();
});

// Routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err : {} 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});