import { z } from 'zod';

// Validation schemas for API requests
export const alertThresholdSchema = z.object({
  threshold: z.number().min(0).max(10000),
  type: z.enum(['email', 'slack'])
});

export const billingCheckoutSchema = z.object({
  plan: z.enum(['Pro', 'Team'])
});

export const apiKeyIdSchema = z.object({
  id: z.string().min(1)
});

// Validation helper function
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errorMessages}` };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

export function createErrorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
