import { z } from 'zod';

export const personalInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  age: z
    .number()
    .min(13, 'Debes tener al menos 13 años')
    .max(120, 'Por favor ingresa una edad válida'),
  weight: z
    .number()
    .min(30, 'El peso debe ser al menos 30 kg')
    .max(300, 'Por favor ingresa un peso válido'),
  height: z
    .number()
    .min(100, 'La altura debe ser al menos 100 cm')
    .max(250, 'Por favor ingresa una altura válida'),
});

export const sportSelectionSchema = z.object({
  sport: z.enum(['boxing', 'running'], {
    message: 'Debes seleccionar un deporte',
  }),
});

export const levelSelectionSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    message: 'Debes seleccionar un nivel',
  }),
});

export const goalsSchema = z.object({
  goals: z
    .string()
    .min(10, 'Por favor describe tus objetivos con más detalle')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
});

export const completeUserDataSchema = personalInfoSchema
  .merge(sportSelectionSchema)
  .merge(levelSelectionSchema)
  .merge(goalsSchema);

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type SportSelectionInput = z.infer<typeof sportSelectionSchema>;
export type LevelSelectionInput = z.infer<typeof levelSelectionSchema>;
export type GoalsInput = z.infer<typeof goalsSchema>;
export type CompleteUserDataInput = z.infer<typeof completeUserDataSchema>;
