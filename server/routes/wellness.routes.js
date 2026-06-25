// FILE: server/routes/wellness.routes.js
const express = require('express')
const router  = express.Router()

// Fallback messages if Gemini fails
const BLINK_FALLBACKS = [
  { message: "Look 20 feet away for 20 seconds. Your eyes will thank you! 👁️", fact: "The 20-20-20 rule reduces digital eye strain by up to 70%." },
  { message: "Blink! You've probably only blinked 4 times in the last minute.", fact: "We blink 66% less while staring at screens — dry eyes incoming." },
  { message: "Slow blink now. Like a cat. It's good for you. 😽", fact: "A full blink spreads a fresh tear film across your entire cornea." },
  { message: "Palming time — cover your eyes with warm palms for 10 seconds.", fact: "Palming relieves eye muscle tension almost instantly." },
  { message: "Look out the window at something far away. Just 20 seconds!", fact: "Focusing on distant objects relaxes the ciliary muscle in your eye." },
  { message: "Blink 10 times slowly right now. Rehydrate those eyes! 💧", fact: "Each blink produces a fresh layer of tear film protecting your cornea." },
  { message: "Eyes feeling tired? Look up, down, left, right — 3 times each.", fact: "Eye exercises improve blood circulation to the ocular muscles." },
]

const BREAK_FALLBACKS = [
  { message: "Time to move! Stand up and stretch your neck side to side.", fact: "Sitting for 30+ minutes increases back pain risk by 40%." },
  { message: "Walk to get water. Hydration + movement = a win-win! 🚶", fact: "A 2-minute walk every 30 minutes boosts circulation by 22%." },
  { message: "Roll your shoulders back 5 times. Release that tension!", fact: "Shoulder tension from screens can cause tension headaches within hours." },
  { message: "Stand up! Touch your toes or just stretch your arms wide.", fact: "Standing improves blood flow to the brain — better focus after the break." },
  { message: "Time for a micro-walk. Even 60 steps counts as movement! 🦵", fact: "Short movement breaks reduce the risk of deep vein thrombosis." },
  { message: "Shake out your hands and wrists — they've been working hard!", fact: "Repetitive strain from typing is the #1 tech worker health complaint." },
  { message: "Take 5 deep breaths and do a gentle neck roll. You earned it!", fact: "Deep breathing for 60 seconds lowers cortisol and improves focus." },
]

router.get('/message', async (req, res) => {
  const { type = 'blink' } = req.query
  const fallbacks = type === 'break' ? BREAK_FALLBACKS : BLINK_FALLBACKS

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = type === 'break'
      ? `Write a short, friendly, energetic message (max 12 words) telling someone to take a 30-minute screen break — stand up, walk, stretch their joints. Then write one interesting health fact (max 18 words) about the benefits of movement breaks from screens. Respond in JSON only: {"message":"...","fact":"..."}`
      : `Write a short, warm, friendly message (max 12 words) reminding someone to blink their eyes and follow the 20-20-20 rule (look 20 feet away for 20 seconds). Then write one surprising fact (max 18 words) about eye health and screen usage. Respond in JSON only: {"message":"...","fact":"..."}`

    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.message && parsed.fact) {
      return res.json({ success: true, ...parsed, ai: true })
    }
    throw new Error('Invalid AI response shape')
  } catch (err) {
    // Fallback to curated messages
    const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    res.json({ success: true, ...pick, ai: false })
  }
})

module.exports = router