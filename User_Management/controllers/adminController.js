const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');

// Utility to hash passwords
const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Error securing password:', error);
    throw error;
  }
};

// Admin login page
const loadLogin = (req, res) => {
  try {
    res.render('login', { message: '' });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

// Admin login verification
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.render('login', { message: 'Email and password are required' });
    }
    
    const userData = await User.findOne({ email });
    
    if (userData && userData.is_admin) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        req.session.admin_id = userData._id;
        return res.redirect('/admin/home');
      }
    }
    
    res.render('login', { message: 'Invalid email or password' });
  } catch (error) {
    console.error(error.message);
    res.render('login', { message: 'Login failed. Please try again.' });
  }
};

// Dashboard home
const loadDashboard = async (req, res) => {
  try {
    const admin = await User.findById(req.session.admin_id);
    if (!admin) {
      return res.redirect('/admin');
    }
    
    // Get some basic stats for the admin dashboard
    const totalUsers = await User.countDocuments({ is_admin: 0 });
    
    res.render('home', { 
      admin: admin,
      stats: {
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error loading dashboard' });
  }
};

// Admin logout
const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/admin');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin');
  }
};

// User management dashboard with search and pagination
const adminDashboard = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Increased from 5 to 10 per page
    
    const query = {
      is_admin: 0
    };
    
    // Add search criteria if search parameter exists
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ name: 1 }); // Sort by name alphabetically
      
    const count = await User.countDocuments(query);
    const totalPages = Math.ceil(count / limit);

    res.render('dashboard', {
      users,
      currentPage: page,
      totalPages,
      totalUsers: count,
      search,
      pages: getPaginationArray(page, totalPages)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error loading user dashboard' });
  }
};

// Helper function to generate pagination array
function getPaginationArray(currentPage, totalPages) {
  const delta = 2;
  const range = [];
  
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }
  
  if (currentPage - delta > 2) {
    range.unshift("...");
  }
  if (currentPage + delta < totalPages - 1) {
    range.push("...");
  }
  
  if (totalPages > 1) {
    range.unshift(1);
  }
  if (totalPages > 1) {
    range.push(totalPages);
  }
  
  return range;
}

// Add new user
const newUserLoad = (req, res) => {
  try {
    res.render('newUser', { message: '' });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};

const addUser = async (req, res) => {
  try {
    const { name, email, mNo } = req.body;
    
    // Input validation
    if (!name || !email || !mNo) {
      return res.render('newUser', { message: 'All fields are required' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('newUser', { message: 'Email already registered' });
    }
    
    // Generate random password
    const password = randomstring.generate(8);
    const hashedPassword = await securePassword(password);

    const newUser = new User({ 
      name, 
      email, 
      mobile: mNo, 
      password: hashedPassword, 
      is_admin: 0 
    });
    
    await newUser.save();
    
    res.render('newUser', { 
      message: 'User added successfully', 
      newUser: { ...newUser.toObject(), plainPassword: password }
    });
  } catch (error) {
    console.error(error.message);
    res.render('newUser', { message: 'Failed to add user. Please try again.' });
  }
};

// Edit user
const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    
    if (!id) {
      return res.redirect('/admin/dashboard');
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.redirect('/admin/dashboard');
    }
    
    res.render('editUser', { user, message: '' });
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error loading user edit page' });
  }
};

const updateUsers = async (req, res) => {
  try {
    const { id, name, email, mNo } = req.body;
    
    // Input validation
    if (!id || !name || !email || !mNo) {
      const user = await User.findById(id);
      return res.render('editUser', { 
        user, 
        message: 'All fields are required' 
      });
    }
    
    // Check if email already exists for another user
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      const user = await User.findById(id);
      return res.render('editUser', { 
        user, 
        message: 'Email already registered to another user' 
      });
    }
    
    await User.findByIdAndUpdate(id, { 
      name, 
      email, 
      mobile: mNo 
    });
    
    res.redirect('/admin/dashboard?updated=true');
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error updating user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    
    if (!id) {
      return res.redirect('/admin/dashboard');
    }
    
    await User.findByIdAndDelete(id);
    res.redirect('/admin/dashboard?deleted=true');
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'Error deleting user' });
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  adminDashboard,
  newUserLoad,
  addUser,
  editUserLoad,
  updateUsers,
  deleteUser
};