const express = require('express');
const { getMassageShops, getMassageShop, createMassageShop, updateMassageShop, deleteMassageShop } = require('../controllers/massageShops')

//Include other resource routers
const appointmentRouter = require('./appointments');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

//Re-route into other resource routers
router.use('/:massageShopId/appointments/', appointmentRouter);
router.route('/').get(getMassageShops).post(protect, authorize('admin'), createMassageShop);
router.route('/:id').get(getMassageShop).put(protect, authorize('admin'), updateMassageShop).delete(protect, authorize('admin'), deleteMassageShop)

module.exports = router;