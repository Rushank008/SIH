const express = require('express');
const router = express.Router();
const { getAssignedRequests,lockRequest,getAssignedRequestById,updateRequestStatus } = require('../controllers/staffController')
const upload = require('../middlewares/multer'); // multer setup (using upload.any())
const { auth, } = require('../middlewares/auth'); // to get req.user

router.get('/staff/requests',auth,getAssignedRequests)
router.patch('/staff/requests/lock/:id', auth, lockRequest);
router.get('/staff/requestsById/:id',auth,getAssignedRequestById)
router.post('/staff/requests/submit/:id',auth,upload.any(),updateRequestStatus)

module.exports = router;