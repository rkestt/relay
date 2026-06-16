import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateRequest<T>(schema: z.Schema<T>, data: unknown): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorResponse = NextResponse.json(
      {
        error: 'Dati non validi',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
    return { success: false, error: errorResponse };
  }

  return { success: true, data: result.data };
}

export * from './auth';
export * from './lobby';
export * from './strategy';
