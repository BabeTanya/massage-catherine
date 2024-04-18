const express = require('express');
const { getMassageTypes, createMassageType } = require('../controllers/massageTypes');

const router = express.Router();
router.get('/', getMassageTypes);
router.post('/', createMassageType);

module.exports = router;