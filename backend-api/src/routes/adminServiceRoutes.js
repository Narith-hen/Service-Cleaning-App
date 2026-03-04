const express = require('express');
const { getAllServices, getServiceById, createService, updateService, deleteService } = require('../controllers/admin/services.controller');
const { upload } = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.post('/services/:id/image', upload.single('images'), updateService);

module.exports = router;
