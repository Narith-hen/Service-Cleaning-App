let arcjetClient = null;

const initArcjet = async () => {
  if (arcjetClient) return arcjetClient;
  if (!process.env.ARCJET_KEY) return null;

  try {
    const arcjetModule = await import('@arcjet/node');
    const arcjet = arcjetModule.default || arcjetModule;
    const { tokenBucket, detectBot, shield } = arcjetModule;

    arcjetClient = arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        shield({ mode: process.env.ARCJET_MODE || 'LIVE' }),
        detectBot({
          mode: process.env.ARCJET_MODE || 'LIVE',
          allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW']
        }),
        tokenBucket({
          mode: process.env.ARCJET_MODE || 'LIVE',
          refillRate: Number(process.env.ARCJET_REFILL_RATE || 10),
          interval: Number(process.env.ARCJET_REFILL_INTERVAL || 60),
          capacity: Number(process.env.ARCJET_CAPACITY || 60)
        })
      ]
    });

    return arcjetClient;
  } catch (error) {
    console.warn('[arcjet] Failed to initialize:', error?.message || error);
    return null;
  }
};

const arcjetMiddleware = async (req, res, next) => {
  try {
    const client = await initArcjet();
    if (!client) return next();

    const decision = await client.protect(req, {
      requested: 1,
      characteristics: {
        userId: req.user?.user_id ? String(req.user.user_id) : undefined
      }
    });

    if (decision?.isDenied?.()) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
  } catch (error) {
    console.warn('[arcjet] Protect error:', error?.message || error);
  }

  return next();
};

module.exports = arcjetMiddleware;
