import en from './en';
import hi from './hi';
import gu from './gu';
import te from './te';

// Available languages configuration
export const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },/*
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳'
  },*/
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳'
  }
];

// Translation resources
export const resources = {
  en,
  hi,
  gu,
  te
};

// Default language
export const defaultLanguage = 'en';

// Local storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'samasth_language_preference';

// Utility function to get nested translation
export const getNestedTranslation = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Utility function to interpolate variables in translations
export const interpolate = (template, variables = {}) => {
  if (!template) return '';
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
};
