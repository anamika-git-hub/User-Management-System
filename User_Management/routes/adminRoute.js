const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/adminAuth');

const adminRoute = express.Router();

// Routes
adminRoute.get('/', auth.isLogout, adminController.loadLogin);
adminRoute.post('/', adminController.verifyLogin);

adminRoute.get('/home', auth.isLogin, adminController.loadDashboard);
adminRoute.get('/dashboard', auth.isLogin, adminController.adminDashboard);

adminRoute.get('/new-user', auth.isLogin, adminController.newUserLoad);
adminRoute.post('/new-user', adminController.addUser);

adminRoute.get('/edit-user', auth.isLogin, adminController.editUserLoad);
adminRoute.post('/edit-user', adminController.updateUsers);

adminRoute.get('/delete-user', auth.isLogin, adminController.deleteUser);

adminRoute.get('/logout', auth.isLogin, adminController.logout);

// Default redirect for invalid routes
adminRoute.get('*', (req, res) => res.redirect('/admin'));

module.exports = adminRoute;