const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// Secure password function
const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error securing password:', error);
    throw error;
  }
};

// Registration page
const loadRegister = (req, res) => {
  try {
    res.render('register', { message: '' });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

// Insert user during registration
const insertUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Input validation
    if (!name || !email || !mobile || !password) {
      return res.render('register', { message: 'All fields are required' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile)) {
      return res.render('register', { message: 'Invalid mobile number. Must be 10 digits and start with 6-9.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { message: 'Email already registered' });
    }

    const hashedPassword = await securePassword(password);
    const newUser = new User({ 
      name, 
      email, 
      mobile, 
      password: hashedPassword, 
      is_admin: 0 
    });

    await newUser.save();
    res.redirect('/?registered=true');
  } catch (error) {
    console.error(error.message);
    res.render('register', { message: 'Registration failed. Please try again.' });
  }
};

// Login page
const loginLoad = (req, res) => {
  try {
    const registered = req.query.registered === 'true';
    res.render('login', { 
      message: registered ? 'Registration successful! You can now log in.' : '' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

// Verify user login
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.render('login', { message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      // Check that this is not an admin account
      if (user.is_admin) {
        return res.render('login', { 
          message: 'Please use the admin login page for administrator accounts' 
        });
      }
      
      req.session.user_id = user._id;
      return res.redirect('/home');
    }
    
    res.render('login', { message: 'Invalid email or password' });
  } catch (error) {
    console.error(error.message);
    res.render('login', { message: 'Login failed. Please try again.' });
  }
};

// Load home page
const loadHome = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    if (!user) {
      return res.redirect('/');
    }
    
    res.render('home', { 
      user: {
        name: user.name, 
        email: user.email, 
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error loading home page' });
  }
};

// Logout
const userLogout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
};

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout
};