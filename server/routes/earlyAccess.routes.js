const express = require('express')
const { register, list } = require('../controllers/earlyAccess.controller')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.post('/', register)        // public — landing pages
router.get('/',  protect, list)   // protected — admin

module.exports = router