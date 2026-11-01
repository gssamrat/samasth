import React from 'react';
import { 
  Bars3Icon, 
  SparklesIcon, 
  TableCellsIcon 
} from '@heroicons/react/24/outline';

const EntryModeSelector = ({ 
  selectedMode, 
  onModeChange, 
  modes = ['sequential', 'flash', 'bulk'],
  className = '',
  showDescription = true,
  customDescriptions = {}
}) => {
  const modeConfig = {
    sequential: {
      value: 'sequential',
      label: 'Sequential',
      icon: Bars3Icon,
      description: '📝 Step-by-step form with all fields visible',
      gradient: '',
      activeClass: 'bg-white text-gray-900 shadow-sm'
    },
    flash: {
      value: 'flash',
      label: 'Flash',
      icon: SparklesIcon,
      description: '⚡ Lightning-fast entry with individual flash modals for each field',
      gradient: 'bg-gradient-to-r from-purple-500 to-blue-500',
      activeClass: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
    },
    bulk: {
      value: 'bulk',
      label: 'Bulk',
      icon: TableCellsIcon,
      description: '📦 Add multiple items to a table, then save all at once',
      gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
    }
  };

  // Merge custom descriptions with defaults
  const descriptions = { ...modeConfig, ...customDescriptions };
  Object.keys(customDescriptions).forEach(key => {
    if (modeConfig[key]) {
      modeConfig[key].description = customDescriptions[key];
    }
  });

  const getCurrentDescription = () => {
    return modeConfig[selectedMode]?.description || '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {modes.map((mode) => {
            const config = modeConfig[mode];
            if (!config) return null;
            
            const Icon = config.icon;
            const isActive = selectedMode === mode;
            
            return (
              <label key={mode} className="cursor-pointer">
                <input
                  type="radio"
                  name="entryMode"
                  value={mode}
                  checked={isActive}
                  onChange={(e) => onModeChange(e.target.value)}
                  className="sr-only"
                />
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive ? config.activeClass : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <Icon className="w-4 h-4" />
                  {config.label}
                </div>
              </label>
            );
          })}
        </div>
      </div>
      
      {/* Mode Description */}
      {showDescription && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            {getCurrentDescription()}
          </p>
        </div>
      )}
    </div>
  );
};

export default EntryModeSelector;