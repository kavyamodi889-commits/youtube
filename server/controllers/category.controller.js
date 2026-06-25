// FILE: server/controllers/category.controller.js
const Category = require('../models/Category')

// ── GET /api/categories ── public ─────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .select('name slug subCategories isDefault order')
      .lean()
    return res.json({ success: true, categories })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/categories ── auth required ─────────────────────────
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'Category name is required' })

    const trimmed = name.trim()

    // Case-insensitive duplicate check in app code
    const all = await Category.find().select('name').lean()
    const existing = all.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing)
      return res.json({ success: true, message: 'Category already exists', category: existing })

    const category = new Category({
      name:      trimmed,
      isDefault: false,
      createdBy: req.user._id,
      order:     999,
    })
    await category.save()

    console.log(`[Category] ➕ "${trimmed}" added by ${req.user._id}`)
    return res.status(201).json({ success: true, message: 'Category added', category })
  } catch (err) {
    console.error('[addCategory]', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── POST /api/categories/:name/subcategories ── auth required ─────
exports.addSubCategory = async (req, res) => {
  try {
    const { name: catName } = req.params
    const { name: subName } = req.body
    if (!subName?.trim())
      return res.status(400).json({ success: false, message: 'Subcategory name is required' })

    const all = await Category.find().select('name subCategories').lean()
    const match = all.find(c => c.name.toLowerCase() === catName.toLowerCase())
    if (!match)
      return res.status(404).json({ success: false, message: 'Category not found' })

    const category = await Category.findById(match._id)
    const trimmed  = subName.trim()

    const dupeSub = category.subCategories.find(
      s => s.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (dupeSub)
      return res.json({ success: true, message: 'Subcategory already exists', category })

    category.subCategories.push({ name: trimmed, createdBy: req.user._id })
    await category.save()

    console.log(`[Category] ➕ sub "${trimmed}" → "${category.name}"`)
    return res.status(201).json({ success: true, message: 'Subcategory added', category })
  } catch (err) {
    console.error('[addSubCategory]', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}