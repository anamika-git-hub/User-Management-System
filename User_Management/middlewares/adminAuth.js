const isLogin = (req, res, next) => req.session.admin_id ? next() : res.redirect('/admin');
const isLogout = (req, res, next) => !req.session.admin_id ? next() : res.redirect('/admin/home');

module.exports = { isLogin, isLogout };
