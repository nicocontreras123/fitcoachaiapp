export const translateLevel = (level: string | undefined): string => {
  if (!level) return '';

  const translations: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  return translations[level.toLowerCase()] || level;
};

export const LEVEL_LABELS = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};
