const express = require('express')
const router = express.Router()
const { IsAdmin,auth } = require('../middlewares/auth')
const { AddService,SeeService,deleteService,editService,getAuditLogs } = require('../controllers/adminController')

router.post('/admin/AddService',[auth,IsAdmin],AddService)
router.get('/SeeService',auth,SeeService)
router.delete('/admin/delete-service/:id',[auth,IsAdmin], deleteService);
router.put('/admin/edit-service/:id',[auth,IsAdmin], editService);
router.get('/admin/audit-logs', auth, IsAdmin, getAuditLogs);

module.exports = router