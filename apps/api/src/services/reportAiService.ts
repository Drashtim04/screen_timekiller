interface ReportAiContext {
  focusHours: number;
  focusScore: number;
  sessionCount: number;
  completedCount: number;
  unlockReasons: Record<string, number>;
  topDistractions: { domain: string; count: number }[];
  productivityChange: number; // percentage, positive or negative
}

export const reportAiService = {
  /**
   * Generates an AI summary for the weekly productivity report
   */
  async generateWeeklySummary(ctx: ReportAiContext): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are an elite AI Focus Coach and Productivity Analyst.
Your task is to analyze a user's weekly focus metrics and write a short, highly motivating, and context-aware summary.
Rules:
- Keep the summary to EXACTLY 3-4 sentences.
- Focus on productivity trends, distractions, and unlock habits.
- Be supportive but direct. Encourage them to improve next week.
- Emphasize the productivity change percentage (e.g. improved by 14% or dropped by 5%).
- Do NOT use generic templates. Address specific distractions if present.`;

    const distractionText = ctx.topDistractions.length > 0
      ? ctx.topDistractions.map(d => `${d.domain} (${d.count} times)`).join(', ')
      : 'None';
    const unlockText = Object.entries(ctx.unlockReasons).map(([r, c]) => `${r}: ${c} times`).join(', ') || 'None';
    const prodTrend = ctx.productivityChange >= 0 
      ? `improved by ${ctx.productivityChange}% compared to last week`
      : `dropped by ${Math.abs(ctx.productivityChange)}% compared to last week`;

    const userPrompt = `Weekly focus stats to analyze:
- Total Focus Time: ${ctx.focusHours} hours
- Focus Score: ${ctx.focusScore}/100
- Sessions Attempted: ${ctx.sessionCount} (${ctx.completedCount} completed successfully)
- Top Distractions Blocked: ${distractionText}
- Emergency Unlocks: ${unlockText}
- Productivity Trend: Your productivity ${prodTrend}.

Write a personalized, concise weekly summary report.`;

    // 1. Try OpenAI if configured
    if (openaiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 150
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && content.trim()) {
            return content.trim();
          }
        }
      } catch (err) {
        console.warn('[Report AI] OpenAI summary generation failed, attempting Groq fallback...', err);
      }
    }

    // 2. Try Groq if configured
    if (groqKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const model = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 150
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && content.trim()) {
            return content.trim();
          }
        }
      } catch (err) {
        console.warn('[Report AI] Groq summary generation failed, serving rule-based output...', err);
      }
    }

    // 3. Static fallback
    const completionRate = ctx.sessionCount > 0 ? Math.round((ctx.completedCount / ctx.sessionCount) * 100) : 0;
    const direction = ctx.productivityChange >= 0 ? 'improved' : 'dropped';
    const percent = Math.abs(ctx.productivityChange);

    return `Your productivity ${direction} by ${percent}% compared to last week. You logged ${ctx.focusHours} hours of focus across ${ctx.sessionCount} sessions, finishing ${ctx.completedCount} successfully (a ${completionRate}% completion rate). Keep protecting your workflow from distractions like ${ctx.topDistractions[0]?.domain || 'social media'} to lock in deep work next week.`;
  }
};
