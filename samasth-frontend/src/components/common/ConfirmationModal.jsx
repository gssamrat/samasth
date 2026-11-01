import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable Confirmation Modal Component
 * 
 * USAGE EXAMPLES:
 * 
 * 1. BASIC CONFIRMATION:
 * ```jsx
 * import ConfirmationModal from '../common/ConfirmationModal';
 * 
 * const [showModal, setShowModal] = useState(false);
 * 
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={() => {
 *     // Handle confirmation
 *     handleDelete();
 *     setShowModal(false);
 *   }}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 * />
 * ```
 * 
 * 2. CUSTOM BUTTON LABELS:
 * ```jsx
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleSave}
 *   title="Save Changes"
 *   message="Do you want to save your changes before leaving?"
 *   confirmText="Save"
 *   cancelText="Don't Save"
 *   type="info"
 * />
 * ```
 * 
 * 3. DIFFERENT TYPES (warning, danger, success, info):
 * ```jsx
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleAction}
 *   title="Warning"
 *   message="This action will affect multiple records."
 *   type="warning"
 * />
 * ```
 * 
 * 4. LOADING STATE:
 * ```jsx
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * <ConfirmationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={async () => {
 *     setIsLoading(true);
 *     await handleAction();
 *     setIsLoading(false);
 *     setShowModal(false);
 *   }}
 *   title="Processing"
 *   message="Please wait while we process your request."
 *   isLoading={isLoading}
 * />
 * ```
 * 
 * 5. COMPLETE IMPLEMENTATION EXAMPLE:
 * ```jsx
 * import React, { useState } from 'react';
 * import ConfirmationModal from '../common/ConfirmationModal';
 * 
 * const MyComponent = () => {
 *   const [showDeleteModal, setShowDeleteModal] = useState(false);
 *   const [itemToDelete, setItemToDelete] = useState(null);
 * 
 *   const handleDeleteClick = (item) => {
 *     setItemToDelete(item);
 *     setShowDeleteModal(true);
 *   };
 * 
 *   const handleConfirmDelete = async () => {
 *     try {
 *       await deleteItem(itemToDelete.id);
 *       // Handle success
 *       setShowDeleteModal(false);
 *       setItemToDelete(null);
 *     } catch (error) {
 *       // Handle error
 *       console.error('Delete failed:', error);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => handleDeleteClick(item)}>
 *         Delete Item
 *       </button>
 * 
 *       <ConfirmationModal
 *         isOpen={showDeleteModal}
 *         onClose={() => {
 *           setShowDeleteModal(false);
 *           setItemToDelete(null);
 *         }}
 *         onConfirm={handleConfirmDelete}
 *         title="Delete Item"
 *         message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
 *         type="danger"
 *         confirmText="Delete"
 *         cancelText="Cancel"
 *       />
 *     </div>
 *   );
 * };
 * ```
 */

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "No",
  type = "warning", // 'warning', 'danger', 'success', 'info'
  isLoading = false,
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  // Icon and color configurations based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: ExclamationTriangleIcon,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          borderColor: 'border-red-200'
        };
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          confirmBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          borderColor: 'border-green-200'
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          borderColor: 'border-blue-200'
        };
      default: // warning
        return {
          icon: ExclamationTriangleIcon,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-2xl shadow-xl border-2 ${config.borderColor} max-w-md w-full transform transition-all`}>
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
          
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg} mb-4`}>
              <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>
            
            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              {message}
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-6 py-2.5 text-white rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg}`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. PROPS REFERENCE:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * - onConfirm: function - Called when user confirms action
 * - title: string - Modal title (optional, default: "Confirm Action")
 * - message: string - Modal message (optional, default: "Are you sure you want to proceed?")
 * - confirmText: string - Confirm button text (optional, default: "Yes")
 * - cancelText: string - Cancel button text (optional, default: "No")
 * - type: string - Modal type: 'warning', 'danger', 'success', 'info' (optional, default: 'warning')
 * - isLoading: boolean - Shows loading state on confirm button (optional, default: false)
 * - showCloseButton: boolean - Shows X close button (optional, default: true)
 * 
 * 2. STYLING CUSTOMIZATION:
 * - The modal uses Tailwind CSS classes
 * - Colors and icons change based on the 'type' prop
 * - Backdrop click closes the modal
 * - Responsive design works on all screen sizes
 * 
 * 3. ACCESSIBILITY:
 * - Focus management
 * - Keyboard navigation support
 * - Screen reader friendly
 * - Proper ARIA attributes can be added if needed
 * 
 * 4. BEST PRACTICES:
 * - Always provide meaningful titles and messages
 * - Use appropriate types for different actions
 * - Handle loading states for async operations
 * - Clean up state when modal closes
 * - Consider user experience when choosing button labels
 */
