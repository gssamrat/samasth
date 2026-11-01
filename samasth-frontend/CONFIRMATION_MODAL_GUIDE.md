# Reusable Confirmation Modal - Quick Reference Guide

## 📁 Files Created

1. **`/src/components/common/ConfirmationModal.jsx`** - Main reusable modal component
2. **`/src/hooks/useConfirmationModal.js`** - Custom hook for easier usage

## 🚀 Quick Usage Examples

### Method 1: Direct Component Usage

```jsx
import React, { useState } from 'react';
import ConfirmationModal from '../common/ConfirmationModal';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    // Your delete logic here
    console.log('Item deleted!');
    setShowModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Delete Item
      </button>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
```

### Method 2: Using Custom Hook (Recommended)

```jsx
import React from 'react';
import useConfirmationModal from '../hooks/useConfirmationModal';

const MyComponent = () => {
  const { showModal, ConfirmationModalComponent } = useConfirmationModal();

  const handleDelete = () => {
    showModal({
      title: "Delete Item",
      message: "Are you sure you want to delete this item?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        console.log('Item deleted!');
      }
    });
  };

  return (
    <div>
      <button onClick={handleDelete}>Delete Item</button>
      {ConfirmationModalComponent}
    </div>
  );
};
```

## 🎨 Modal Types & Colors

- **`type="warning"`** - Yellow theme (default)
- **`type="danger"`** - Red theme (for deletions, destructive actions)
- **`type="success"`** - Green theme (for confirmations, completions)
- **`type="info"`** - Blue theme (for information, updates)

## ⚙️ Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility |
| `onClose` | function | - | Called when modal should close |
| `onConfirm` | function | - | Called when user confirms action |
| `title` | string | "Confirm Action" | Modal title |
| `message` | string | "Are you sure you want to proceed?" | Modal message |
| `confirmText` | string | "Yes" | Confirm button text |
| `cancelText` | string | "No" | Cancel button text |
| `type` | string | "warning" | Modal theme (warning/danger/success/info) |
| `isLoading` | boolean | false | Shows loading spinner on confirm button |
| `showCloseButton` | boolean | true | Shows X close button |

## 📝 Real-world Implementation Examples

### 1. Delete Confirmation
```jsx
<ConfirmationModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  title="Delete Product"
  message="Are you sure you want to delete this product? This action cannot be undone."
  type="danger"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

### 2. Save Before Leaving
```jsx
<ConfirmationModal
  isOpen={showSaveModal}
  onClose={() => setShowSaveModal(false)}
  onConfirm={handleSave}
  title="Save Changes"
  message="You have unsaved changes. Do you want to save before leaving?"
  type="info"
  confirmText="Save"
  cancelText="Don't Save"
/>
```

### 3. High Amount Warning (GenerateCoupon Implementation)
```jsx
<ConfirmationModal
  isOpen={showAmountConfirmModal}
  onClose={handleAmountCancellation}
  onConfirm={handleAmountConfirmation}
  title="High Bill Amount Alert"
  message={`You entered ₹${amount.toLocaleString('en-IN')}. This will generate ${Math.floor(amount/1000)} coupons. Please confirm this is correct.`}
  type="warning"
  confirmText="Yes, Generate Coupons"
  cancelText="No, Let me Check"
/>
```

### 4. Bulk Operations
```jsx
const handleBulkDelete = () => {
  showModal({
    title: "Delete Multiple Items",
    message: `You are about to delete ${selectedItems.length} items. This action cannot be undone.`,
    type: "danger",
    confirmText: "Delete All",
    cancelText: "Keep Items",
    onConfirm: () => {
      // Bulk delete logic
      console.log("Bulk delete confirmed");
    }
  });
};
```

### 5. With Loading State
```jsx
const [isLoading, setIsLoading] = useState(false);

<ConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={async () => {
    setIsLoading(true);
    await handleAsyncAction();
    setIsLoading(false);
    setShowModal(false);
  }}
  title="Processing"
  message="This may take a few seconds..."
  isLoading={isLoading}
/>
```

## 🎯 GenerateCoupon Integration

The modal has been successfully integrated into the GenerateCoupon component:

- **Triggers when**: Bill amount > ₹10,000
- **Shows**: Formatted amount and number of coupons to be generated
- **Options**: Continue with generation or cancel to verify amount
- **Safety**: Prevents accidental large coupon generation

### Test Cases:
- ₹5,000 → No modal, generates normally
- ₹12,000 → Shows modal: "You entered ₹12,000. This will generate 12 coupons..."
- ₹50,000 → Shows modal: "You entered ₹50,000. This will generate 50 coupons..."

## 🔧 Customization Tips

1. **Custom Colors**: Modify the `getTypeConfig()` function in ConfirmationModal.jsx
2. **Additional Icons**: Import more icons from Heroicons and add new types
3. **Animation**: Adjust transition classes for different effects
4. **Size**: Modify `max-w-md` class to change modal width
5. **Backdrop**: Change `bg-opacity-50` to adjust backdrop darkness

## 📱 Mobile Responsive

The modal is fully responsive and works on all screen sizes with proper padding and scaling.

## ♿ Accessibility

- Keyboard navigation support
- Focus management
- Screen reader friendly
- Proper button roles and labels

## 🚨 Best Practices

1. Always provide clear, descriptive messages
2. Use appropriate types for different actions
3. Handle loading states for async operations
4. Clean up state when modal closes
5. Test with different message lengths
6. Consider user experience when choosing button labels
7. Don't overuse - reserve for important confirmations only
