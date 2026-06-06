import crypto from 'crypto';

interface CoachingContext {
  userId: string;
  domain: string;
  currentGoal: string | null;
  distractionAttempts: number;
  focusScore: number;
  streakDays: number;
  timeRemainingSeconds: number;
  sessionDurationSeconds: number;
}

// In-memory cache for coaching responses
// Key: md5 hash of context parameters (domain, goal, attempts, score, etc.)
const responseCache = new Map<string, { response: string; expires: number }>();

// In-memory rate limiter
// Key: userId, Value: array of timestamps of requests
const rateLimitMap = new Map<string, number[]>();

const DEFAULT_TTL_SECONDS = 300; // 5 minutes cache
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Computes a hash key from the context to cache identical requests
 */
function getCacheKey(ctx: CoachingContext): string {
  const data = `${ctx.domain}-${ctx.currentGoal || ''}-${ctx.distractionAttempts}-${ctx.focusScore}-${ctx.streakDays}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Checks and updates rate limiting for a user
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  
  // Filter out timestamps older than the window
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(userId, activeTimestamps);
  return true;
}

/**
 * Rule-based fallback coaching message when Groq API fails or is rate limited
 */
function getFallbackCoaching(ctx: CoachingContext): string {
  const cleanDomain = ctx.domain.replace(/^\*\./, '');
  if (ctx.currentGoal) {
    return `You have attempted to visit ${cleanDomain} ${ctx.distractionAttempts} times during this focus session. Stay focused on your current goal: ${ctx.currentGoal}.`;
  }
  return `You have attempted to visit ${cleanDomain} ${ctx.distractionAttempts} times. Protect your streak of ${ctx.streakDays} days and get back to work.`;
}

/**
 * Fetches coaching response from Groq API with retries and timeout
 */
async function fetchFromGroqWithRetry(systemPrompt: string, userPrompt: string, retries = 2): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 120
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      
      if (content && content.trim()) {
        return content.trim();
      }
      throw new Error('Empty response from Groq API');

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Groq Service] Attempt ${attempt} failed: ${err.message}`);
      
      if (attempt === retries) {
        throw err;
      }
      // Small backoff before retry
      await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

export const groqService = {
  /**
   * Generates a context-aware focus coach message
   */
  async generateCoachingMessage(ctx: CoachingContext): Promise<{ message: string; source: 'groq' | 'cache' | 'fallback' }> {
    // 1. Check Rate Limit
    if (!checkRateLimit(ctx.userId)) {
      console.info(`[Groq Service] Rate limit exceeded for user ${ctx.userId}. Serving fallback.`);
      return { message: getFallbackCoaching(ctx), source: 'fallback' };
    }

    // 2. Check Cache
    const cacheKey = getCacheKey(ctx);
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return { message: cached.response, source: 'cache' };
    }

    // 3. Generate Prompts
    const systemPrompt = `You are an elite, firm but supportive AI productivity coach.
Provide real-time coaching directly to a user who just got distracted by visiting a blocked website.
Follow these prompt rules:
- Keep messages short: MAXIMUM 2 sentences.
- Do NOT use generic motivational quotes.
- Use a slightly firm but supportive tone.
- Address the specific distraction website and details provided in the context.
- Avoid repetitive responses.
- Do not greet the user (no "Hey there", "Hi"). Speak directly.`;

    const cleanDomain = ctx.domain.replace(/^\*\./, '');
    const minutesRemaining = Math.max(0, Math.round(ctx.timeRemainingSeconds / 60));
    const sessionDurationMinutes = Math.max(0, Math.round(ctx.sessionDurationSeconds / 60));

    const userPrompt = `Context:
- Website attempted: "${cleanDomain}"
- Current focus goal: ${ctx.currentGoal ? `"${ctx.currentGoal}"` : 'None specified'}
- Focus score today: ${ctx.focusScore}/100
- Distraction attempts today: ${ctx.distractionAttempts}
- Streak info: ${ctx.streakDays} days streak
- Focus session timer: ${minutesRemaining} minutes remaining out of ${sessionDurationMinutes} minutes total

Coaching task: Generate a short context-aware coaching warning (Max 2 sentences).`;

    // 4. Invoke API with Fallback
    try {
      const message = await fetchFromGroqWithRetry(systemPrompt, userPrompt);
      
      // Cache the successful response
      const ttlSeconds = Number(process.env.COACH_CACHE_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
      responseCache.set(cacheKey, {
        response: message,
        expires: Date.now() + ttlSeconds * 1000
      });

      return { message, source: 'groq' };
    } catch (err: any) {
      console.error(`[Groq Service] Failed to call Groq API: ${err.message}. Serving fallback.`);
      return { message: getFallbackCoaching(ctx), source: 'fallback' };
    }
  }
};
