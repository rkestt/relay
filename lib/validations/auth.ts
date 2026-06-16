import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password deve essere almeno 8 caratteri').max(100),
  username: z.string().min(3, 'Username deve essere almeno 3 caratteri').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username può contenere solo lettere, numeri e underscore'),
});

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});
