const express = require('express');
const router = express.Router();
const { ApplyService,AppliedService,AppliedServiceByID } = require('../controllers/userController');
const upload = require('../middlewares/multer'); // multer setup (using upload.any())
const { auth, } = require('../middlewares/auth'); // to get req.user

// Use upload.any() to accept dynamic file names
router.post('/apply/:id', auth, upload.any(), ApplyService);
router.get('/applied',auth,AppliedService)
router.get('/appliedById',auth,AppliedServiceByID)

module.exports = router;