const express = require('express');
const { showLiveness, showReadiness } = require('../controllers/healthController');

const router = express.Router();

router.get('/health/live', showLiveness);
router.get('/health/ready', showReadiness);

module.exports = router;
