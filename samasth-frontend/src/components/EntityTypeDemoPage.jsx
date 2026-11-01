import React, { useState } from 'react';
import EntityTypeSelector from './EntityTypeSelector';

const EntityTypeDemoPage = () => {
  const [selectedEntityType, setSelectedEntityType] = useState('');

  const handleEntityTypeSelect = (entityType) => {
    setSelectedEntityType(entityType.id);
    console.log('Selected entity type:', entityType);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Entity Type Management Demo
          </h1>
          <p className="text-lg text-gray-600">
            This demo shows the new "Add Entity Type" functionality with nested unit creation.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <EntityTypeSelector 
            selectedType={selectedEntityType}
            onTypeSelect={handleEntityTypeSelect}
          />
        </div>

        {selectedEntityType && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">Selected Entity Type</h3>
            <p className="text-green-700">
              You have selected: <strong>{selectedEntityType}</strong>
            </p>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-3">Features Demonstrated</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• ✅ Professional UI with user-friendly color scheme</li>
            <li>• ✅ Add Entity Type button with modal popup</li>
            <li>• ✅ Parent/Child entity type hierarchy selection</li>
            <li>• ✅ Unit selection with ability to create new units</li>
            <li>• ✅ Nested modal for adding units when needed</li>
            <li>• ✅ Form validation and error handling</li>
            <li>• ✅ Professional button styling and transitions</li>
            <li>• ✅ Proper API integration structure</li>
          </ul>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">API Endpoints Used</h4>
          <div className="text-sm text-amber-700 space-y-1">
            <p><strong>Entity Types:</strong> POST /api/v1/entity-types</p>
            <p><strong>Units:</strong> POST /api/v1/units, GET /api/v1/units</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityTypeDemoPage;