import { z } from 'zod';

export const createStrategySchema = z.object({
  title: z.string().min(5, 'Titolo deve essere almeno 5 caratteri').max(100, 'Titolo massimo 100 caratteri'),
  description: z.string().max(2000, 'Descrizione massimo 2000 caratteri').optional(),
  map_id: z.string().min(1, 'Map ID richiesto'),
  site_id: z.string().min(1, 'Site ID richiesto'),
  operator_id: z.string().min(1, 'Operator ID richiesto'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Massimo 20 tag').optional(),
  image_url: z.string().url('URL immagine non valido').optional(),
  hotspots: z
    .array(
      z.object({
        x_percent: z.number().min(0).max(100),
        y_percent: z.number().min(0).max(100),
        label: z.string().max(100).optional(),
        image_id: z.string().min(1).optional(),
      }),
    )
    .max(50, 'Massimo 50 hotspot')
    .optional(),
  images: z.array(z.string().url('URL immagine non valido')).max(10, 'Massimo 10 immagini').optional(),
});

export const updateStrategySchema = createStrategySchema.partial();
