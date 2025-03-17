const express = require('express');
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

const userRoute = express.Router();

// Routes
userRoute.get('/register', auth.isLogout, userController.loadRegister);
userRoute.post('/register', userController.insertUser);

userRoute.get('/', auth.isLogout, userController.loginLoad);
userRoute.post('/login', userController.verifyLogin);

userRoute.get('/home', auth.isLogin, userController.loadHome);
userRoute.get('/logout', auth.isLogin, userController.userLogout);

module.exports = userRoute;