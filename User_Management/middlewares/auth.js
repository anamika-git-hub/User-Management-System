const isLogin = (req, res, next) => req.session.user_id ? next() : res.redirect('/');
const isLogout = (req, res, next) => !req.session.user_id ? next() : res.redirect('/home');

module.exports = { isLogin, isLogout };
