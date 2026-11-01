import React, { useState } from 'react';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useLocalization } from '../../contexts/LocalizationContext';
import { languages } from '../../locales';

/**
 * Language Selector Component
 * 
 * USAGE:
 * ```jsx
 * import LanguageSelector from './components/common/LanguageSelector';
 * 
 * // In your component (e.g., Header, Sidebar)
 * function Header() {
 *   return (
 *     <div className="header">
 *       <LanguageSelector />
 *     </div>
 *   );
 * }
 * 
 * // With custom styling
 * <LanguageSelector 
 *   variant="compact" 
 *   position="bottom-right"
 *   className="custom-class"
 * />
 * ```
 */

const LanguageSelector = ({ 
  variant = 'default', // 'default', 'compact', 'minimal'
  position = 'bottom-left', // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
  className = '',
  showFlag = true,
  showNativeName = true
}) => {
  const { currentLanguage, changeLanguage, t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    closeDropdown();
  };

  // Position classes for dropdown
  const positionClasses = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0'
  };

  // Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-1 text-sm';
      case 'minimal':
        return 'p-1';
      default:
        return 'px-3 py-2';
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Language Selector Button */}
      <button
        onClick={toggleDropdown}
        onBlur={() => setTimeout(closeDropdown, 150)} // Delay to allow click on dropdown items
        className={`
          ${getVariantClasses()}
          bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200 flex items-center gap-2 min-w-fit
        `}
        aria-label={t('common.selectLanguage') || 'Select Language'}
      >
        {/* Language Icon (for minimal variant) */}
        {variant === 'minimal' ? (
          <LanguageIcon className="w-5 h-5 text-gray-600" />
        ) : (
          <>
            {/* Flag */}
            {showFlag && currentLang?.flag && (
              <span className="text-lg">{currentLang.flag}</span>
            )}
            
            {/* Language Name */}
            <span className="font-medium text-gray-700">
              {variant === 'compact' 
                ? currentLang?.code.toUpperCase()
                : showNativeName 
                  ? currentLang?.nativeName 
                  : currentLang?.name
              }
            </span>
            
            {/* Dropdown Arrow */}
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={closeDropdown}
          />
          
          {/* Dropdown Content */}
          <div className={`
            absolute z-20 ${positionClasses[position]} 
            ${position.startsWith('top') ? 'mb-1' : 'mt-1'}
            bg-white border border-gray-200 rounded-lg shadow-lg
            min-w-full overflow-hidden
          `}>
            {/* Dropdown Header */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <LanguageIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t('common.selectLanguage') || 'Select Language'}
                </span>
              </div>
            </div>
            
            {/* Language Options */}
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 
                    focus:bg-gray-50 focus:outline-none
                    transition-colors duration-150 flex items-center gap-3
                    ${currentLanguage === language.code 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'text-gray-700'
                    }
                  `}
                >
                  {/* Flag */}
                  <span className="text-lg">{language.flag}</span>
                  
                  {/* Language Info */}
                  <div className="flex-1">
                    <div className="font-medium">{language.nativeName}</div>
                    {variant !== 'compact' && (
                      <div className="text-xs text-gray-500">{language.name}</div>
                    )}
                  </div>
                  
                  {/* Current Language Indicator */}
                  {currentLanguage === language.code && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Footer (optional) */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {t('common.languagePreferenceSaved') || 'Language preference will be saved'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
