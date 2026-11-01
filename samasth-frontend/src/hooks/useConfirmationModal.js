import { useState } from 'react';
import ConfirmationModal from '../components/common/ConfirmationModal';

/**
 * Custom Hook for Confirmation Modal
 * 
 * USAGE:
 * ```jsx
 * import useConfirmationModal from '../hooks/useConfirmationModal';
 * 
 * const MyComponent = () => {
 *   const { 
 *     isOpen, 
 *     showModal, 
 *     hideModal, 
 *     ConfirmationModalComponent 
 *   } = useConfirmationModal();
 * 
 *   const handleDelete = () => {
 *     showModal({
 *       title: "Delete Item",
 *       message: "Are you sure you want to delete this item?",
 *       type: "danger",
 *       onConfirm: () => {
 *         // Handle delete logic
 *         console.log("Item deleted");
 *         hideModal();
 *       }
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleDelete}>Delete</button>
 *       {ConfirmationModalComponent}
 *     </div>
 *   );
 * };
 * ```
 */

const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const showModal = (props) => {
    setModalProps(props);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    // Clear props after animation completes
    setTimeout(() => setModalProps({}), 300);
  };

  const ConfirmationModalComponent = (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={hideModal}
      {...modalProps}
    />
  );

  return {
    isOpen,
    showModal,
    hideModal,
    ConfirmationModalComponent
  };
};

export default useConfirmationModal;
