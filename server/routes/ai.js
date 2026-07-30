import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/ai/suggest
// Get AI-powered suggestion for flashcard back
router.post('/suggest', auth, async (req, res) => {
  try {
    const { front } = req.body;

    if (!front || !front.trim()) {
      return res.status(400).json({ message: 'Front is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ message: 'OpenRouter API key not configured' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'Flashcard App'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `You are a flashcard assistant. Given a word or phrase, reply with only a short, clear definition or translation suitable for the back of a flashcard. No extra explanation.

Word or phrase: ${front.trim()}`
        }],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      return res.status(500).json({ message: 'No suggestion returned from AI' });
    }

    res.json({ suggestion });
  } catch (error) {
    console.error('AI suggestion error:', error.message);
    res.status(500).json({ message: 'Failed to get AI suggestion', error: error.message });
  }
});

export default router;