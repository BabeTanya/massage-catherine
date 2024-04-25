const express = require('express');
const { getMassageTypes, createMassageType } = require('../controllers/massageTypes');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.route('/').get(getMassageTypes).post(protect, authorize('admin'), createMassageType);

module.exports = router;