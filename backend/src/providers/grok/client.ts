import { logger } from '../../utils/logger';
import { env } from '../../config/env';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export interface GrokResponse {
  usedProvider?: boolean;
  prediction: string;
  reasoning: string;
  recommendedBet?: string;
}

export class GrokClient {
  private apiKey: string;
  private cache: Map<string, { data: GrokResponse; timestamp: number }> = new Map();
  private cacheTtl: number = 5 * 60 * 1000; // 5 minutes for AI responses

  constructor() {
    this.apiKey = env.GROK_API_KEY;
  }

  async generateResponse(prompt: string, retries = 2): Promise<GrokResponse> {
    if (env.FIXTURE_MODE) return {
      prediction: 'Synthetic demonstration; no validated prediction',
      reasoning: 'Generated fixture data was used to demonstrate feature building. No sports or AI provider was contacted.',
      usedProvider: false
    };
    // Check cache
    const cacheKey = this.hashPrompt(prompt);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      logger.debug('Grok cache hit');
      return cached.data;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`Grok API request (attempt ${attempt}/${retries})`);

        const response = await fetch(GROK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: env.GROK_MODEL,
            messages: [
              {
                role: 'system',
                content: this.getSystemPrompt()
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,  // Lower temperature for more factual responses
            max_completion_tokens: 1500,
            stream: false
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`Grok API error: ${response.status}`, errorText);
          
          if (response.status === 429) {
            logger.warn('Grok rate limit hit, waiting before retry');
            await this.sleep(2000 * attempt);
            continue;
          }
          
          throw new Error(`Grok API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Empty response from Grok API');
        }

        // Parse the structured response
        const parsedResponse = { ...this.parseResponse(content), usedProvider: true };
        
        // Cache the result
        this.cache.set(cacheKey, { data: parsedResponse, timestamp: Date.now() });
        
        logger.info('Grok response generated successfully');
        return parsedResponse;

      } catch (error) {
        logger.error(`Grok request failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt < retries) {
          await this.sleep(1000 * attempt);
        } else {
          // Return graceful fallback on final failure
          return {
            prediction: 'Unable to predict - AI service unavailable',
            usedProvider: false,
            reasoning: 'The AI service encountered an error. Please try again later.',
            recommendedBet: undefined
          };
        }
      }
    }

    return {
      prediction: 'Unable to predict',
      usedProvider: false,
      reasoning: 'Service temporarily unavailable. Please try again.',
      recommendedBet: undefined
    };
  }

  private getSystemPrompt(): string {
    return `You are an expert football analyst AI that provides data-driven match predictions.

CRITICAL RULES:
1. ONLY use the data provided in the prompt - never invent or hallucinate statistics
2. If data is missing or insufficient, clearly state this uncertainty
3. Always provide probability-based predictions, not guarantees
4. Format your response in the exact structure requested

OUTPUT FORMAT (STRICT JSON):
{
  "prediction": "HOME_WIN/DRAW/AWAY_WIN with confidence level",
  "reasoning": "2-3 sentences explaining your analysis based ONLY on provided data",
  "recommendedBet": "Optional: safest betting recommendation based on data"
}

CONFIDENCE LEVELS:
- High (70%+): Strong statistical evidence from recent form, H2H, and standings
- Medium (50-70%): Mixed indicators or close matchup
- Low (<50%): Insufficient data or highly unpredictable match

REMEMBER:
- You are analyzing data, not giving guarantees
- Football is unpredictable - always acknowledge uncertainty
- Use phrases like "based on the data" or "statistics suggest"
- Never claim certainty or use absolute language like "will win"`;
  }

  private parseResponse(content: string): GrokResponse {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          prediction: parsed.prediction || 'Unknown',
          reasoning: parsed.reasoning || content.substring(0, 500),
          recommendedBet: parsed.recommendedBet
        };
      }

      // Fallback: extract information from text response
      return {
        prediction: this.extractPrediction(content),
        reasoning: content.substring(0, 500),
        recommendedBet: this.extractBet(content)
      };
    } catch (error) {
      logger.error('Failed to parse Grok response', error);
      return {
        prediction: 'Unknown',
        reasoning: content.substring(0, 500),
        recommendedBet: undefined
      };
    }
  }

  private extractPrediction(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('home win') || lowerContent.includes('home team')) {
      return 'HOME_WIN';
    }
    if (lowerContent.includes('away win') || lowerContent.includes('away team')) {
      return 'AWAY_WIN';
    }
    if (lowerContent.includes('draw')) {
      return 'DRAW';
    }
    
    return 'UNCERTAIN';
  }

  private extractBet(content: string): string | undefined {
    const betPatterns = [
      /recommended bet[\s:]*(.*?)(?:\n|$)/i,
      /safest bet[\s:]*(.*?)(?:\n|$)/i,
      /best value[\s:]*(.*?)(?:\n|$)/i,
      /bet suggestion[\s:]*(.*?)(?:\n|$)/i
    ];

    for (const pattern of betPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }

    return undefined;
  }

  private hashPrompt(prompt: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
