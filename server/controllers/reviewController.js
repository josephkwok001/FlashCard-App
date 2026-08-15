import Review from '../models/Review.js';

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

// @desc    Review history aggregates for the last N days
// @route   GET /api/reviews/stats
export const getReviewStats = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const now = new Date();
    const since = startOfUtcDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

    const reviews = await Review.find({
      userId: req.user.id,
      createdAt: { $gte: since }
    }).lean();

    const qualityCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byDayMap = new Map();

    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      byDayMap.set(dayKey(d), 0);
    }

    for (const review of reviews) {
      const q = review.quality;
      if (qualityCounts[q] != null) qualityCounts[q] += 1;
      const key = dayKey(new Date(review.createdAt));
      if (byDayMap.has(key)) {
        byDayMap.set(key, byDayMap.get(key) + 1);
      }
    }

    const total = reviews.length;
    const remembered = qualityCounts[3] + qualityCounts[4];

    res.json({
      days,
      total,
      rememberedRate: total === 0 ? 0 : remembered / total,
      qualityCounts,
      byDay: [...byDayMap.entries()].map(([date, count]) => ({ date, count }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
