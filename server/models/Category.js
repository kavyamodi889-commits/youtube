// FILE: server/models/Category.js
const mongoose = require('mongoose')

const subCategorySchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true, timestamps: true }
)

const categorySchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    slug:          { type: String, trim: true, lowercase: true },
    subCategories: { type: [subCategorySchema], default: [] },
    isDefault:     { type: Boolean, default: false },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    order:         { type: Number, default: 999 },
  },
  { timestamps: true }
)

// Async pre-save — no next() needed in Mongoose 6+
categorySchema.pre('save', async function () {
  this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})

// Simple indexes — no unique on slug to avoid E11000 on special chars
categorySchema.index({ name: 1 })
categorySchema.index({ order: 1 })

const Category = mongoose.model('Category', categorySchema)

Category.seedDefaults = async function () {
  const count = await Category.countDocuments()
  if (count > 0) return

  const defaults = [
    'Education', 'Entertainment', 'Gaming', 'Music',
    'News & Politics', 'Science & Technology', 'Sports',
    'Travel & Events', 'Comedy', 'Film & Animation',
    'Howto & Style', 'People & Blogs', 'General',
    'Motivation', 'Technology', 'Finance', 'Fitness',
    'Just Chatting', 'Art', 'Cooking',
  ]

  const docs = defaults.map((name, i) => ({
    name,
    slug:      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    isDefault: true,
    order:     i,
  }))

  await Category.insertMany(docs, { ordered: false }).catch(() => {})
  console.log('[Category] ✅ Seeded default categories')
}

module.exports = Category