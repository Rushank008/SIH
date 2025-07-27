const { auth,IsAdmin } = require('../middlewares/auth')
const express = require('express')
const router = express.Router()
const { sendOtp,signup,login,admin_signup,admin_login } = require('../controllers/authController')

router.post('/sendOtp',sendOtp)
router.post('/signup',signup)
router.post('/login',login)
router.post('/admin/signup' ,[auth, IsAdmin],admin_signup)
router.post('/admin/login',admin_login)

module.exports = router