import { z } from 'zod';

export const createLobbySchema = z.object({
  starting_side: z.enum(['attacker', 'defender']).optional(),
});

export const joinLobbySchema = z.object({
  room_code: z
    .string()
    .length(6, 'Room code deve essere 6 caratteri')
    .transform((v) => v.trim().toUpperCase()),
});

export const banOperatorSchema = z.object({
  operator_id: z.string().min(1, 'Operator ID richiesto'),
  side: z.enum(['attacker', 'defender'], { message: 'Side richiesto (attacker/defender)' }),
});

export const assignTaskSchema = z.object({
  user_id: z.string().min(1, 'User ID richiesto'),
  operator_id: z.string().min(1, 'Operator ID richiesto'),
});

export const lockSelectionSchema = z.object({
  map_id: z.string().min(1, 'Map ID richiesto').optional(),
  site_id: z.string().min(1, 'Site ID richiesto').optional(),
  operator_id: z.string().min(1, 'Operator ID richiesto').optional(),
});

export const winnerSideSchema = z.object({
  winner_side: z.enum(['attacker', 'defender'], {
    message: 'winner_side richiesto (attacker/defender)',
  }),
  team_side: z.enum(['attacker', 'defender']).optional(),
});

export const voteSchema = z.object({
  vote_type: z.enum(['up', 'down']).nullable(),
});

export const setMapSchema = z.object({
  map_id: z.string().min(1, 'Map ID richiesto'),
});
