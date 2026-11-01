import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  resources, 
  defaultLanguage, 
  LANGUAGE_STORAGE_KEY, 
  getNestedTranslation, 
  interpolate 
} from '../locales';

// Create the localization context
const LocalizationContext = createContext();

/**
 * Localization Provider Component
 * 
 * USAGE:
 * Wrap your app with this provider in main.jsx or App.jsx:
 * 
 * ```jsx
 * import { LocalizationProvider } from './contexts/LocalizationContext';
 * 
 * function App() {
 *   return (
 *     <LocalizationProvider>
 *       <YourAppComponents />
 *     </LocalizationProvider>
 *   );
 * }
 * ```
 */
export const LocalizationProvider = ({ children }) => {
  // Get initial language from localStorage or use default
  const getInitialLanguage = () => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && resources[saved]) {
      return saved;
    }
    return defaultLanguage;
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);
  const [translations, setTranslations] = useState(resources[currentLanguage]);

  // Update translations when language changes
  useEffect(() => {
    setTranslations(resources[currentLanguage]);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    
    // Set document direction for RTL languages (if needed in future)
    // document.dir = ['ar', 'fa', 'he'].includes(currentLanguage) ? 'rtl' : 'ltr';
  }, [currentLanguage]);

  // Function to change language
  const changeLanguage = (languageCode) => {
    if (resources[languageCode]) {
      setCurrentLanguage(languageCode);
    } else {
      console.warn(`Language '${languageCode}' not found. Available languages:`, Object.keys(resources));
    }
  };

  // Translation function with interpolation support
  const t = (key, variables = {}) => {
    const translation = getNestedTranslation(translations, key);
    
    if (!translation) {
      console.warn(`Translation key '${key}' not found for language '${currentLanguage}'`);
      return key; // Return the key itself as fallback
    }

    return interpolate(translation, variables);
  };

  // Context value
  const contextValue = {
    currentLanguage,
    changeLanguage,
    t,
    translations,
    availableLanguages: Object.keys(resources)
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};

/**
 * Custom hook to use localization
 * 
 * USAGE:
 * ```jsx
 * import { useLocalization } from './contexts/LocalizationContext';
 * 
 * function MyComponent() {
 *   const { t, currentLanguage, changeLanguage } = useLocalization();
 * 
 *   return (
 *     <div>
 *       <h1>{t('navigation.dashboard')}</h1>
 *       <button onClick={() => changeLanguage('hi')}>
 *         Switch to Hindi
 *       </button>
 *       <p>Current language: {currentLanguage}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  
  return context;
};

/**
 * Higher-Order Component for localization (alternative to hook)
 * 
 * USAGE:
 * ```jsx
 * import { withLocalization } from './contexts/LocalizationContext';
 * 
 * function MyComponent({ t, currentLanguage, changeLanguage }) {
 *   return (
 *     <div>
 *       <h1>{t('navigation.dashboard')}</h1>
 *     </div>
 *   );
 * }
 * 
 * export default withLocalization(MyComponent);
 * ```
 */
export const withLocalization = (Component) => {
  return function LocalizedComponent(props) {
    const localizationProps = useLocalization();
    return <Component {...props} {...localizationProps} />;
  };
};
