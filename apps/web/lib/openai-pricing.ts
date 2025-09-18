import { prisma } from '@repo/db';

// Current OpenAI pricing as of 2024 (per 1M tokens)
export const OPENAI_PRICING = {
  'gpt-4': { input: 30.0, output: 60.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 1.5, output: 2.0 },
  'gpt-3.5-turbo-16k': { input: 3.0, output: 4.0 },
} as const;

export type OpenAIModel = keyof typeof OPENAI_PRICING;

/**
 * Get current pricing for a model from database or fallback to hardcoded values
 */
export async function getModelPricing(model: string): Promise<{ input: number; output: number }> {
  try {
    // Try to get latest pricing from database
    const providerRate = await prisma.providerRate.findFirst({
      where: {
        provider: 'openai',
        model: model.toLowerCase(),
      },
      orderBy: {
        effectiveAt: 'desc',
      },
    });

    if (providerRate) {
      return {
        input: providerRate.inputPer1M,
        output: providerRate.outputPer1M,
      };
    }

    // Fallback to hardcoded pricing
    const modelKey = model.toLowerCase() as OpenAIModel;
    return OPENAI_PRICING[modelKey] || OPENAI_PRICING['gpt-3.5-turbo'];
  } catch (error) {
    console.error('Error fetching model pricing:', error);
    // Fallback to hardcoded pricing
    const modelKey = model.toLowerCase() as OpenAIModel;
    return OPENAI_PRICING[modelKey] || OPENAI_PRICING['gpt-3.5-turbo'];
  }
}

/**
 * Calculate cost based on model and token usage
 */
export async function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<number> {
  const pricing = await getModelPricing(model);
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Initialize provider rates in database with current OpenAI pricing
 */
export async function initializeProviderRates(): Promise<void> {
  try {
    const now = new Date();
    
    for (const [model, pricing] of Object.entries(OPENAI_PRICING)) {
      // Check if rate already exists for this model
      const existingRate = await prisma.providerRate.findFirst({
        where: {
          provider: 'openai',
          model: model,
          effectiveAt: now,
        },
      });

      if (!existingRate) {
        await prisma.providerRate.create({
          data: {
            provider: 'openai',
            model: model,
            inputPer1M: pricing.input,
            outputPer1M: pricing.output,
            effectiveAt: now,
          },
        });
        console.log(`Initialized pricing for ${model}`);
      }
    }
  } catch (error) {
    console.error('Error initializing provider rates:', error);
  }
}

/**
 * Update pricing for a specific model
 */
export async function updateModelPricing(
  model: string,
  inputPer1M: number,
  outputPer1M: number,
  effectiveAt: Date = new Date()
): Promise<void> {
  await prisma.providerRate.create({
    data: {
      provider: 'openai',
      model: model.toLowerCase(),
      inputPer1M,
      outputPer1M,
      effectiveAt,
    },
  });
}

/**
 * Get all current model pricing
 */
export async function getAllModelPricing(): Promise<Record<string, { input: number; output: number }>> {
  try {
    const rates = await prisma.providerRate.findMany({
      where: {
        provider: 'openai',
      },
      orderBy: {
        effectiveAt: 'desc',
      },
    });

    const pricing: Record<string, { input: number; output: number }> = {};
    
    // Get the latest rate for each model
    for (const rate of rates) {
      if (!pricing[rate.model]) {
        pricing[rate.model] = {
          input: rate.inputPer1M,
          output: rate.outputPer1M,
        };
      }
    }

    // Fill in any missing models with hardcoded values
    for (const [model, hardcodedPricing] of Object.entries(OPENAI_PRICING)) {
      if (!pricing[model]) {
        pricing[model] = hardcodedPricing;
      }
    }

    return pricing;
  } catch (error) {
    console.error('Error fetching all model pricing:', error);
    return OPENAI_PRICING;
  }
}
