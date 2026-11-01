import React, { useState, useEffect } from 'react';
import { EyeIcon, PrinterIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { stickerAPI, clientPrintAPI } from '../../services/api';

const StickerTemplateDesigner = ({ stockData, onPrint }) => {
  const [template, setTemplate] = useState({
    name: 'Default Product Label',
    width: 50,
    height: 30,
    fields: [
      { id: 'product_name', label: 'Product Name', x: 5, y: 5, fontSize: 12, enabled: true },
      { id: 'product_code', label: 'Product Code', x: 5, y: 15, fontSize: 10, enabled: true },
      { id: 'price', label: 'Price', x: 5, y: 25, fontSize: 12, enabled: true },
      { id: 'batch_number', label: 'Batch Number', x: 30, y: 15, fontSize: 8, enabled: false },
      { id: 'expiry_date', label: 'Expiry Date', x: 30, y: 25, fontSize: 8, enabled: false }
    ]
  });
  const [generatedZPL, setGeneratedZPL] = useState('');
  const [preview, setPreview] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [printerConfigs, setPrinterConfigs] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrinterConfigs();
    generateZPL();
  }, [template, stockData]);

  const fetchPrinterConfigs = async () => {
    try {
      const configs = await clientPrintAPI.getPrinters();
      // Ensure configs is always an array
      const configArray = Array.isArray(configs) ? configs : 
                         configs?.printers ? configs.printers : 
                         configs?.data ? configs.data : [];
      
      setPrinterConfigs(configArray);
      if (configArray.length > 0) {
        setSelectedPrinter(configArray[0].address || configArray[0].id);
      } else {
        // Set default printer if no configurations available
        setSelectedPrinter('default-printer');
      }
    } catch (error) {
      console.error('Error fetching printer configs:', error);
      setPrinterConfigs([]); // Set empty array on error
      setSelectedPrinter('default-printer'); // Set default printer on error
      toast.error('Failed to load printer configurations. Using default printer.');
    }
  };

  const generateZPL = () => {
    const enabledFields = template.fields.filter(field => field.enabled);
    
    let zpl = `^XA\n^CF0,${template.fields[0]?.fontSize || 12}\n`;
    
    enabledFields.forEach(field => {
      let value = '';
      
      switch (field.id) {
        case 'product_name':
          value = stockData?.product_name || stockData?.productName || 'Sample Product';
          break;
        case 'product_code':
          value = stockData?.product_code || stockData?.productCode || 'PRD-001';
          break;
        case 'price':
          const price = stockData?.selling_price || stockData?.sellingPrice || stockData?.purchase_price || stockData?.purchasePrice;
          value = price ? `$${parseFloat(price).toFixed(2)}` : '$0.00';
          break;
        case 'batch_number':
          value = stockData?.batch_number || stockData?.batchNumber || 'B001';
          break;
        case 'expiry_date':
          const expiry = stockData?.expiry_date || stockData?.expiryDate;
          value = expiry ? new Date(expiry).toLocaleDateString() : '';
          break;
        default:
          value = 'Sample Text';
      }
      
      if (value) {
        zpl += `^FO${field.x * 8},${field.y * 8}^CF0,${field.fontSize}^FD${value}^FS\n`;
      }
    });
    
    zpl += '^XZ';
    setGeneratedZPL(zpl);
  };

  const handleFieldUpdate = (fieldId, property, value) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, [property]: value } : field
      )
    }));
  };

  const handleTemplateUpdate = (property, value) => {
    setTemplate(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const validateZPL = async () => {
    if (!generatedZPL.trim()) {
      toast.error('No ZPL content to validate');
      return;
    }

    setLoading(true);
    try {
      const result = await stickerAPI.validateZPL(generatedZPL);
      setValidationResult(result);
      
      if (result.is_valid) {
        toast.success('ZPL is valid!');
      } else {
        toast.error(`ZPL validation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error validating ZPL:', error);
      toast.error('Failed to validate ZPL');
    } finally {
      setLoading(false);
    }
  };

  const previewSticker = async () => {
    if (!generatedZPL.trim()) {
      toast.error('No ZPL content to preview');
      return;
    }

    setLoading(true);
    try {
      const previewData = {
        zpl: generatedZPL,
        width: template.width,
        height: template.height
      };
      
      const result = await stickerAPI.preview(previewData);
      setPreview(result);
      toast.success('Preview generated successfully!');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const printStickers = async () => {
    if (!generatedZPL.trim()) {
      toast.error('No ZPL content to print');
      return;
    }

    if (!selectedPrinter) {
      toast.error('Please select a printer');
      return;
    }

    // Use default printer if no specific printer configurations are available
    const printerAddress = selectedPrinter === 'default-printer' ? 'default' : selectedPrinter;

    setLoading(true);
    try {
      const printData = {
        zpl: generatedZPL,
        printer_address: printerAddress,
        copies: copies,
        layout: {
          width: template.width,
          height: template.height
        }
      };

      const result = await clientPrintAPI.generate(printData);
      toast.success(`Print job submitted successfully! Job ID: ${result.jobId}`);
      
      if (onPrint) {
        onPrint(result);
      }
    } catch (error) {
      console.error('Error printing stickers:', error);
      toast.error('Failed to submit print job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <PrinterIcon className="w-5 h-5 text-white" />
          </div>
          Sticker Template Designer
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Design and customize your product stickers
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Template Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => handleTemplateUpdate('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm)
            </label>
            <input
              type="number"
              value={template.width}
              onChange={(e) => handleTemplateUpdate('width', parseInt(e.target.value))}
              min="10"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (mm)
            </label>
            <input
              type="number"
              value={template.height}
              onChange={(e) => handleTemplateUpdate('height', parseInt(e.target.value))}
              min="10"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Field Configuration */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Field Configuration</h3>
          <div className="space-y-4">
            {template.fields.map((field) => (
              <div key={field.id} className={`p-4 border rounded-lg ${field.enabled ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={(e) => handleFieldUpdate(field.id, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="font-medium text-gray-900">{field.label}</span>
                  </label>
                </div>

                {field.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">X Position</label>
                      <input
                        type="number"
                        value={field.x}
                        onChange={(e) => handleFieldUpdate(field.id, 'x', parseInt(e.target.value))}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Y Position</label>
                      <input
                        type="number"
                        value={field.y}
                        onChange={(e) => handleFieldUpdate(field.id, 'y', parseInt(e.target.value))}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={field.fontSize}
                        onChange={(e) => handleFieldUpdate(field.id, 'fontSize', parseInt(e.target.value))}
                        min="6"
                        max="20"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-xs text-gray-600">
                        Sample: {field.id === 'product_name' ? (stockData?.productName || 'Product Name') : 
                                field.id === 'product_code' ? (stockData?.productCode || 'PRD-001') :
                                field.id === 'price' ? '$10.99' : 'Sample'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ZPL Output and Validation */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Generated ZPL Code</h3>
          <div className="space-y-4">
            <textarea
              value={generatedZPL}
              onChange={(e) => setGeneratedZPL(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Generated ZPL code will appear here..."
            />
            
            <div className="flex items-center gap-4">
              <button
                onClick={validateZPL}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                Validate ZPL
              </button>

              {validationResult.is_valid && (
                <div className={`flex items-center gap-2 text-sm ${validationResult.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.is_valid ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  )}
                  {validationResult.is_valid ? 'Valid ZPL' : `Invalid: ${validationResult.error}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Print Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Printer
              </label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Choose a printer...</option>
                {printerConfigs && printerConfigs.length > 0 ? (
                  printerConfigs.map((printer, index) => (
                    <option key={index} value={printer.address || printer.id || `printer-${index}`}>
                      {printer.name || printer.address || `Printer ${index + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="default-printer">Default Printer</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Copies
              </label>
              <input
                type="number"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          
          {(!printerConfigs || printerConfigs.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-900">No Printers Configured</h5>
                  <p className="text-sm text-yellow-700 mt-1">
                    No printer configurations found. You can still generate and preview ZPL code, 
                    but printing functionality will be limited.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={previewSticker}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <EyeIcon className="w-4 h-4" />
            Preview Sticker
          </button>

          <button
            onClick={printStickers}
            disabled={loading || (!selectedPrinter && (!printerConfigs || printerConfigs.length === 0))}
            className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="w-4 h-4" />
            Print {copies > 1 ? `${copies} Stickers` : 'Sticker'}
          </button>
        </div>

        {/* Preview Display */}
        {preview && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sticker Preview</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              {preview.imageUrl ? (
                <img 
                  src={preview.imageUrl} 
                  alt="Sticker Preview" 
                  className="max-w-full h-auto border border-gray-300"
                />
              ) : (
                <div className="text-center text-gray-600">
                  <p>Preview will be displayed here</p>
                  <p className="text-sm mt-2">Dimensions: {template.width}mm x {template.height}mm</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerTemplateDesigner;
