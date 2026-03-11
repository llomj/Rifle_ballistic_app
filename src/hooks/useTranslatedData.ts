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
      exampleBeginner: normalizeFrenchProse(item.exampleBeginner),
      exampleIntermediate: normalizeFrenchProse(item.exampleIntermediate),
      exampleExpert: normalizeFrenchProse(item.exampleExpert),
      explanationBeginner: normalizeFrenchProse(item.explanationBeginner),
      explanationIntermediate: normalizeFrenchProse(item.explanationIntermediate),
      explanationExpert: normalizeFrenchProse(item.explanationExpert),
    }));
  }
  return GLOSSARY;
};
