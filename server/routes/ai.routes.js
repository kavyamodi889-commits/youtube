// FILE: server/routes/ai.routes.js
const express  = require('express')
const { protect } = require('../middleware/auth')
const router   = express.Router()

// Lazy-load Gemini to avoid startup crash if key missing
function getModel() {
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── POST /api/ai/video-metadata ───────────────────────────────────
// Given a title (+ optional thumbnail base64), generate description + tags + category
router.post('/video-metadata', protect, async (req, res) => {
  const { title, thumbnailBase64, mimeType = 'image/jpeg' } = req.body
  if (!title?.trim())
    return res.status(400).json({ success: false, message: 'Title required' })

  try {
    const model  = getModel()
    const prompt = `You are an expert YouTube SEO assistant. Based on the video title${thumbnailBase64 ? ' and thumbnail image' : ''}, generate:
1. A compelling video description (2-3 paragraphs, natural language, SEO friendly, no hashtags in body)
2. 8-12 relevant tags (single words or short phrases, no #)
3. The best matching category from: Education, Entertainment, Gaming, Music, News & Politics, Science & Technology, Sports, Travel & Events, Comedy, Film & Animation, General

Video title: "${title.trim()}"

Respond ONLY in JSON, no markdown:
{"description":"...","tags":["tag1","tag2"],"category":"..."}`

    let result
    if (thumbnailBase64) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: thumbnailBase64, mimeType } }
      ])
    } else {
      result = await model.generateContent(prompt)
    }

    const parsed = parseJSON(result.response.text())
    if (!parsed.description || !parsed.tags || !parsed.category)
      throw new Error('Invalid shape')

    res.json({ success: true, ...parsed })
  } catch (err) {
    console.error('[ai/video-metadata]', err.message)
    res.status(500).json({ success: false, message: 'AI generation failed. Try again.' })
  }
})

// ── POST /api/ai/moderate-comment ────────────────────────────────
// Check a comment for spam / hate / toxicity
router.post('/moderate-comment', protect, async (req, res) => {
  const { text } = req.body
  if (!text?.trim())
    return res.status(400).json({ success: false, message: 'Text required' })

  try {
    const model  = getModel()
    const prompt = `You are a content moderator. Analyse this YouTube comment and respond ONLY in JSON, no markdown:
{"safe": true/false, "reason": "brief reason if unsafe, empty string if safe", "severity": "none|low|medium|high"}

Safe means: normal discussion, feedback, compliments, questions, mild criticism.
Unsafe means: hate speech, slurs, spam, threats, self-harm encouragement, NSFW content.

Comment: "${text.trim().slice(0, 500)}"`

    const result = await model.generateContent(prompt)
    const parsed = parseJSON(result.response.text())
    res.json({ success: true, ...parsed })
  } catch (err) {
    console.error('[ai/moderate-comment]', err.message)
    // On failure, default to safe so we don't block real comments
    res.json({ success: true, safe: true, reason: '', severity: 'none' })
  }
})

// ── POST /api/ai/improve-title ────────────────────────────────────
// Suggest 3 better title variations
router.post('/improve-title', protect, async (req, res) => {
  const { title } = req.body
  if (!title?.trim())
    return res.status(400).json({ success: false, message: 'Title required' })

  try {
    const model  = getModel()
    const prompt = `You are a YouTube SEO expert. Suggest 3 improved, click-worthy title variations for this video.
Keep them natural, specific, and under 70 characters. No clickbait. No ALL CAPS words.

Original title: "${title.trim()}"

Respond ONLY in JSON, no markdown: {"suggestions":["title1","title2","title3"]}`

    const result = await model.generateContent(prompt)
    const parsed = parseJSON(result.response.text())
    res.json({ success: true, suggestions: parsed.suggestions || [] })
  } catch (err) {
    console.error('[ai/improve-title]', err.message)
    res.status(500).json({ success: false, message: 'AI generation failed.' })
  }
})

module.exports = router