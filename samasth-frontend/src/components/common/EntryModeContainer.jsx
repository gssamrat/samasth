import React, { useState } from 'react';
import EntryModeSelector from './EntryModeSelector';

const EntryModeContainer = ({
  title,
  description,
  availableModes = ['sequential', 'flash', 'bulk'],
  defaultMode = 'flash',
  customDescriptions = {},
  forms = {},
  onModeChange,
  showModeSelector = true,
  className = '',
  children
}) => {
  const [selectedMode, setSelectedMode] = useState(defaultMode);

  const handleModeChange = (newMode) => {
    setSelectedMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const renderCurrentForm = () => {
    // If forms object is provided, use it to render the appropriate form
    if (forms[selectedMode]) {
      return forms[selectedMode];
    }
    
    // If children is a function, call it with the selected mode
    if (typeof children === 'function') {
      return children(selectedMode);
    }
    
    // Otherwise return children as-is
    return children;
  };

  return (
    <div className={className}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center mb-6">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Mode Selector */}
      {showModeSelector && (
        <div className="mb-6">
          <EntryModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            modes={availableModes}
            customDescriptions={customDescriptions}
          />
        </div>
      )}

      {/* Form Content */}
      <div>
        {renderCurrentForm()}
      </div>
    </div>
  );
};

export default EntryModeContainer;