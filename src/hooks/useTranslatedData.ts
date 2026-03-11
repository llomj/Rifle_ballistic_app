import { useLanguage } from '../contexts/LanguageContext';
import { GLOSSARY, type GlossaryItem } from '../constants';
import { RIFLE_GLOSSARY_FR } from '../data/rifleGlossaryTranslations';
import { normalizeFrenchProse } from '../utils/frenchText';

export const useTranslatedGlossary = (): GlossaryItem[] => {
  const { language } = useLanguage();
  if (language === 'fr') {
    return RIFLE_GLOSSARY_FR.map((item) => ({
      ...item,
      definition: normalizeFrenchProse(item.definition),
      detailedDescription: normalizeFrenchProse(item.detailedDescription),
    }));
  }
  return GLOSSARY;
};
