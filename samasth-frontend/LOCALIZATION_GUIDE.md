# Localization Guide

This document explains how to use the localization system in the Samasth Dashboard Frontend.

## Overview

The localization system supports multiple languages:
- **English (en)** - Default language
- **Hindi (hi)** - Devanagari script
- **Gujarati (gu)** - Gujarati script

## Quick Start

### 1. Using Translations in Components

```jsx
import { useLocalization } from '../contexts/LocalizationContext';

function MyComponent() {
  const { t, currentLanguage, changeLanguage } = useLocalization();
  
  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### 2. Adding the Language Selector

```jsx
import LanguageSelector from './common/LanguageSelector';

function Header() {
  return (
    <div className="header">
      <LanguageSelector variant="default" />
      {/* or */}
      <LanguageSelector variant="compact" />
      {/* or */}
      <LanguageSelector variant="minimal" />
    </div>
  );
}
```

### 3. Setting up Localization Provider

Make sure your app is wrapped with the LocalizationProvider:

```jsx
import { LocalizationProvider } from './contexts/LocalizationContext';

function App() {
  return (
    <LocalizationProvider>
      <YourAppContent />
    </LocalizationProvider>
  );
}
```

## Translation Key Structure

Translation keys are organized hierarchically:

```javascript
{
  common: {
    save: 'Save',
    cancel: 'Cancel',
    // ... other common keys
  },
  navigation: {
    dashboard: 'Dashboard',
    home: 'Home',
    // ... navigation keys
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome to Dashboard',
    // ... dashboard specific keys
  }
  // ... other sections
}
```

## Adding New Translations

### Step 1: Add to English file (`src/locales/en.js`)

```javascript
const en = {
  // Existing sections...
  
  myNewSection: {
    title: 'My New Section',
    description: 'This is a new section',
    buttons: {
      create: 'Create New',
      update: 'Update Existing'
    }
  }
};
```

### Step 2: Add to Hindi file (`src/locales/hi.js`)

```javascript
const hi = {
  // Existing sections...
  
  myNewSection: {
    title: 'मेरा नया अनुभाग',
    description: 'यह एक नया अनुभाग है',
    buttons: {
      create: 'नया बनाएं',
      update: 'मौजूदा को अपडेट करें'
    }
  }
};
```

### Step 3: Add to Gujarati file (`src/locales/gu.js`)

```javascript
const gu = {
  // Existing sections...
  
  myNewSection: {
    title: 'મારો નવો વિભાગ',
    description: 'આ એક નવો વિભાગ છે',
    buttons: {
      create: 'નવું બનાવો',
      update: 'હાલનું અપડેટ કરો'
    }
  }
};
```

## Using Translation Keys

### Basic Usage
```jsx
const title = t('myNewSection.title');
const createButton = t('myNewSection.buttons.create');
```

### With Interpolation
If you need to pass variables to translations, you can use interpolation:

```javascript
// In translation file
welcome: 'Welcome, {name}!'

// In component
const message = t('common.welcome', { name: user.name });
```

## Language Selector Variants

### Default Variant
```jsx
<LanguageSelector variant="default" />
```
- Shows flag, language name, and dropdown arrow
- Full-width display
- Best for headers or main navigation

### Compact Variant
```jsx
<LanguageSelector variant="compact" />
```
- Shows flag and language code (EN/HI/GU)
- Smaller footprint
- Good for toolbars

### Minimal Variant
```jsx
<LanguageSelector variant="minimal" />
```
- Shows only flag icon
- Very compact
- Perfect for sidebars or mobile interfaces

## Best Practices

### 1. Consistent Key Naming
- Use camelCase for key names
- Group related keys under logical sections
- Use descriptive names that indicate context

```javascript
// Good
navigation: {
  dashboard: 'Dashboard',
  userSettings: 'User Settings'
}

// Avoid
nav: {
  dash: 'Dashboard',
  usr_set: 'User Settings'
}
```

### 2. Keep Translations Short and Clear
- Avoid very long text strings
- Consider UI space constraints
- Use clear, simple language

### 3. Test All Languages
- Always test your UI with all supported languages
- Check for text overflow issues
- Verify right-to-left languages if added later

### 4. Organize by Feature/Page
Structure your translations by feature or page for better maintainability:

```javascript
{
  // Good organization
  userProfile: {
    title: 'User Profile',
    form: {
      name: 'Full Name',
      email: 'Email Address'
    },
    actions: {
      save: 'Save Profile',
      cancel: 'Cancel Changes'
    }
  }
}
```

## Migration from Hardcoded Text

When converting existing components:

### Before
```jsx
<button>Save Changes</button>
<h1>Dashboard</h1>
<p>Loading data...</p>
```

### After
```jsx
<button>{t('common.saveChanges')}</button>
<h1>{t('navigation.dashboard')}</h1>
<p>{t('common.loadingData')}</p>
```

## Debugging

### Check Current Language
```jsx
const { currentLanguage } = useLocalization();
console.log('Current language:', currentLanguage);
```

### Missing Translation Keys
The system will return the key itself if a translation is missing:
```jsx
t('nonexistent.key') // Returns: 'nonexistent.key'
```

### Available Languages
```jsx
import { languages } from '../locales';
console.log('Available languages:', languages);
```

## File Structure

```
src/
├── locales/
│   ├── index.js      # Main configuration and utilities
│   ├── en.js         # English translations
│   ├── hi.js         # Hindi translations
│   └── gu.js         # Gujarati translations
├── contexts/
│   └── LocalizationContext.jsx  # React context provider
└── components/
    └── common/
        └── LanguageSelector.jsx  # Language selector component
```

## Integration Checklist

- [ ] Wrap app with LocalizationProvider
- [ ] Import useLocalization hook in components
- [ ] Replace hardcoded text with t() function calls
- [ ] Add LanguageSelector component to UI
- [ ] Add translation keys to all language files
- [ ] Test language switching functionality
- [ ] Verify UI layout with different languages
- [ ] Test persistence of language selection

## Troubleshooting

### Language not persisting
Check localStorage: the language preference is stored with key `samasth_dashboard_language`

### Missing translations showing as keys
Ensure the translation key exists in all language files with the same structure

### Layout breaking with longer translations
Consider using CSS text truncation or adjust container sizes for different languages
