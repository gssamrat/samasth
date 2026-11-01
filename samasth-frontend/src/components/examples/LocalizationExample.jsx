import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import LanguageSelector from '../common/LanguageSelector';

/**
 * Example component demonstrating localization usage
 * This component shows how to use the localization system
 */
const LocalizationExample = () => {
  const { t, currentLanguage } = useLocalization();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('common.language')} {t('common.settings')} - Example
        </h1>
        <LanguageSelector variant="default" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Navigation Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-600">
            {t('navigation.dashboard')} {t('common.info')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>• {t('navigation.home')}</li>
            <li>• {t('navigation.entityManagement')}</li>
            <li>• {t('navigation.stockManagement')}</li>
            <li>• {t('navigation.sales')}</li>
            <li>• {t('navigation.reports')}</li>
          </ul>
        </div>

        {/* Common Actions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-600">
            {t('common.actions')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
              {t('common.save')}
            </button>
            <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
              {t('common.cancel')}
            </button>
            <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
              {t('common.edit')}
            </button>
            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
              {t('common.delete')}
            </button>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-purple-600">
            {t('common.status')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{t('common.systemOnline')}</span>
            </div>
            <div>
              <span className="text-gray-600">{t('common.version')}: 1.0.0</span>
            </div>
            <div>
              <span className="text-gray-600">{t('common.language')}: {currentLanguage}</span>
            </div>
          </div>
        </div>

        {/* Stock Management Examples */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">
            {t('stock.title')}
          </h3>
          <ul className="space-y-1 text-sm">
            <li>• {t('stock.addStock')}</li>
            <li>• {t('stock.editStock')}</li>
            <li>• {t('stock.stockList')}</li>
            <li>• {t('stock.lowStock')}</li>
          </ul>
        </div>

        {/* Sales Examples */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-orange-600">
            {t('sales.title')}
          </h3>
          <ul className="space-y-1 text-sm">
            <li>• {t('sales.newSale')}</li>
            <li>• {t('sales.dailySales')}</li>
            <li>• {t('sales.totalSales')}</li>
            <li>• {t('sales.topProducts')}</li>
          </ul>
        </div>

        {/* Form Examples */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-teal-600">
            {t('forms.firstName')} & {t('forms.lastName')}
          </h3>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder={t('forms.fullName')}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <input 
              type="email" 
              placeholder={t('forms.email')}
              className="w-full px-2 py-1 border rounded text-sm"
            />
            <input 
              type="tel" 
              placeholder={t('forms.phoneNumber')}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Language Selector Variants */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Language Selector Variants
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Default:</span>
            <LanguageSelector variant="default" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Compact:</span>
            <LanguageSelector variant="compact" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Minimal:</span>
            <LanguageSelector variant="minimal" />
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Quick Usage Guide:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Import: <code className="bg-blue-100 px-1 rounded">import {'{ useLocalization }'} from '../contexts/LocalizationContext';</code></p>
          <p>• Use hook: <code className="bg-blue-100 px-1 rounded">const {'{ t }'} = useLocalization();</code></p>
          <p>• Translate: <code className="bg-blue-100 px-1 rounded">{'t(\'common.save\')'}</code></p>
          <p>• Language selector: <code className="bg-blue-100 px-1 rounded">{'<LanguageSelector variant="default" />'}</code></p>
        </div>
      </div>
    </div>
  );
};

export default LocalizationExample;
