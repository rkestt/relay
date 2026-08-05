import { z } from 'zod';

export const createStrategySchema = z.object({
  title: z.string().min(5, 'Titolo deve essere almeno 5 caratteri').max(100, 'Titolo massimo 100 caratteri'),
  description: z.string().max(2000, 'Descrizione massimo 2000 caratteri').optional(),
  map_id: z.string().min(1, 'Map ID richiesto'),
  site_id: z.string().min(1, 'Site ID richiesto'),
  operator_id: z.string().min(1, 'Operator ID richiesto'),
  side: z.enum(['attacker', 'defender'], { message: 'Lato richiesto (attacker o defender)' }),
  aux_operator_ids: z
    .array(z.string().min(1))
    .max(4, 'Massimo 4 operatori ausiliari')
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Massimo 20 tag').optional(),
  image_url: z.string().url('URL immagine non valido').optional(),
  images: z.array(z.string().url('URL immagine non valido')).max(10, 'Massimo 10 immagini').optional(),
});

export const updateStrategySchema = createStrategySchema.partial();
