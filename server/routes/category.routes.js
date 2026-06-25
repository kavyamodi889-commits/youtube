// FILE: server/routes/category.routes.js
const express = require('express')
const { protect } = require('../middleware/auth')
const {
  getAll,
  addCategory,
  addSubCategory,
} = require('../controllers/category.controller')

const router = express.Router()

router.get('/',                          getAll)           // public
router.post('/',          protect,       addCategory)      // creator only
router.post('/:name/subcategories', protect, addSubCategory) // creator only

module.exports = router