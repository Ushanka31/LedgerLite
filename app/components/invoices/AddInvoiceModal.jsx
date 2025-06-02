'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().min(1, 'Currency is required'),
  includeVat: z.boolean().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export default function AddInvoiceModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState({ name: 'Your Business' });

  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: '',
      currency: 'NGN',
      includeVat: true, // VAT included by default but optional
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: '',
      items: [
        { description: '', quantity: 1, unitPrice: 0 }
      ],
    },
  });

  // Fetch company info
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/company', { credentials: 'include' });
        const result = await response.json();
        if (result.success && result.company) {
          setCompanyInfo({ 
            name: result.company.name || 'Your Business',
            email: result.company.email || 'contact@business.com',
            phone: result.company.phone || '+234 XXX XXX XXXX',
            address: result.company.address || '',
            website: result.company.website || ''
          });
        } else {
          console.log('Could not fetch company info:', result.error);
          // Fallback to user name from test API
          const userResponse = await fetch('/api/test', { credentials: 'include' });
          const userResult = await userResponse.json();
          if (userResult.success && userResult.user) {
            setCompanyInfo({ 
              name: userResult.user.name || 'Your Business',
              email: 'contact@business.com',
              phone: '+234 XXX XXX XXXX',
              address: '',
              website: ''
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch company info:', error);
        setCompanyInfo({ 
          name: 'Your Business',
          email: 'contact@business.com',
          phone: '+234 XXX XXX XXXX',
          address: '',
          website: ''
        });
      }
    };
    fetchCompanyInfo();
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const generateInvoicePDF = async (invoiceData, invoiceNumber) => {
    try {
      console.log('Starting PDF generation...', { invoiceData, invoiceNumber });
      
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      const doc = new jsPDF();
      
      // Currency symbols and formatting (PDF-safe versions)
      const currencySymbols = {
        'NGN': 'NGN ',  // Use NGN instead of ₦ for PDF compatibility
        'USD': '$',
        'GBP': '£',
        'EUR': '€'
      };
      
      const selectedCurrency = invoiceData.currency || 'NGN';
      const currencySymbol = currencySymbols[selectedCurrency] || 'NGN';
      
      // Format currency without problematic characters
      const formatCurrencyPDF = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0.00';
        
        // Simple number formatting without locale issues
        const formattedNumber = num.toFixed(2);
        const parts = formattedNumber.split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        return `${currencySymbol}${integerPart}.${parts[1]}`;
      };
      
      // Set document properties
      doc.setProperties({
        title: `Invoice ${invoiceNumber}`,
        subject: 'Invoice',
        author: companyInfo.name,
        creator: `${companyInfo.name} - Invoice System`
      });

      // Company header (use actual company name)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(companyInfo.name, 20, 30);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Professional Invoice System', 20, 40);
      doc.text(`Email: ${companyInfo.email}`, 20, 50);
      doc.text(`Phone: ${companyInfo.phone}`, 20, 60);

      // Invoice title and number
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 150, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #: ${invoiceNumber}`, 150, 45);
      doc.text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-GB')}`, 150, 55);
      doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString('en-GB')}`, 150, 65);

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 75, 190, 75);

      // Bill to section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 90);
      
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceData.customerName, 20, 105);

      // Items table header
      let yPosition = 130;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Table headers
      doc.text('Description', 20, yPosition);
      doc.text('Qty', 120, yPosition);
      doc.text('Unit Price', 140, yPosition);
      doc.text('Total', 170, yPosition);
      
      // Header line
      doc.setLineWidth(0.3);
      doc.line(20, yPosition + 3, 190, yPosition + 3);

      // Items
      yPosition += 15;
      doc.setFont('helvetica', 'normal');
      
      invoiceData.items.forEach((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        
        doc.text(item.description, 20, yPosition);
        doc.text(item.quantity.toString(), 120, yPosition);
        doc.text(formatCurrencyPDF(item.unitPrice), 140, yPosition);
        doc.text(formatCurrencyPDF(lineTotal), 170, yPosition);
        
        yPosition += 12;
      });

      // Totals section
      yPosition += 10;
      doc.setLineWidth(0.3);
      doc.line(130, yPosition, 190, yPosition);
      
      yPosition += 15;
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 130, yPosition);
      doc.text(formatCurrencyPDF(invoiceData.subtotal), 170, yPosition);
      
      // Only show VAT if included
      if (invoiceData.includeVat && invoiceData.vatAmount > 0) {
        yPosition += 12;
        doc.text('VAT (7.5%):', 130, yPosition);
        doc.text(formatCurrencyPDF(invoiceData.vatAmount), 170, yPosition);
      }
      
      yPosition += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', 130, yPosition);
      doc.text(formatCurrencyPDF(invoiceData.totalAmount), 170, yPosition);

      // Notes section
      if (invoiceData.notes) {
        yPosition += 25;
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPosition);
        
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
        doc.text(splitNotes, 20, yPosition);
        yPosition += splitNotes.length * 5;
      }

      // Thank you message (simplified and neutral)
      yPosition += 25;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.text('Thank you', 20, yPosition);

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Generated by LedgerLite - Professional Invoice System', 20, pageHeight - 20);

      // Save the PDF
      console.log('Saving PDF...');
      doc.save(`Invoice-${invoiceNumber}.pdf`);
      console.log('PDF saved successfully');
      
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  const handleSubmit = async (data) => {
    console.log('🚀 FORM SUBMITTED! Data received:', data);
    setLoading(true);
    setError('');

    try {
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const vatAmount = data.includeVat ? subtotal * 0.075 : 0; // VAT only if included
      const totalAmount = subtotal + vatAmount;
      
      const invoiceData = {
        ...data,
        customerId: data.customerName, // We'll create customer if needed
        subtotal,
        vatAmount,
        totalAmount,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
      };

      console.log('Sending invoice to API...', invoiceData);

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
        credentials: 'include', // Important: include cookies
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      
      let result;
      try {
        result = await response.json();
        console.log('API response data:', result);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Server returned invalid JSON. Status: ${response.status}, Response: ${textResponse.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          result: result
        });
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Invoice created successfully, generating PDF...');
      
      // Generate PDF after successful invoice creation
      const pdfGenerated = await generateInvoicePDF(invoiceData, result.invoice.invoiceNumber);
      
      if (!pdfGenerated) {
        console.warn('PDF generation failed, but invoice was created successfully');
        setError('Invoice created successfully, but PDF generation failed. Please try downloading the PDF manually.');
      } else {
        console.log('PDF generated and downloaded successfully');
      }

      // Success - close modal and call success callback
      form.reset();
      onSuccess?.(result.invoice);
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(`Failed to create invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, currency = 'NGN') => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    const currencyMap = {
      'NGN': { code: 'NGN', symbol: '₦' },
      'USD': { code: 'USD', symbol: '$' },
      'GBP': { code: 'GBP', symbol: '£' },
      'EUR': { code: 'EUR', symbol: '€' }
    };
    
    const selectedCurrency = currencyMap[currency] || currencyMap['NGN'];
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Calculate totals for display (with optional VAT)
  const items = form.watch('items') || [];
  const selectedCurrency = form.watch('currency') || 'NGN';
  const includeVat = form.watch('includeVat') || false;
  const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  const vatAmount = includeVat ? subtotal * 0.075 : 0;
  const totalAmount = subtotal + vatAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative glass-card p-8 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-dark">Create Invoice</h2>
              <p className="text-medium text-sm mt-1">Generate a new invoice for your customer</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-light hover:text-dark rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Customer Name *
                </label>
                <input
                  {...form.register('customerName')}
                  type="text"
                  placeholder="Customer or company name"
                  className="w-full glass-input"
                  disabled={loading}
                />
                {form.formState.errors.customerName && (
                  <p className="mt-2 text-sm text-red-600">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Due Date *
                </label>
                <input
                  {...form.register('dueDate')}
                  type="date"
                  className="w-full glass-input"
                  disabled={loading}
                />
                {form.formState.errors.dueDate && (
                  <p className="mt-2 text-sm text-red-600">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Currency *
              </label>
              <select
                {...form.register('currency')}
                className="w-full glass-input"
                disabled={loading}
              >
                <option value="NGN">Nigerian Naira (₦)</option>
              </select>
              {form.formState.errors.currency && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.currency.message}
                </p>
              )}
            </div>

            {/* VAT Option */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  {...form.register('includeVat')}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-dark">
                  Include VAT (7.5%)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this box to add 7.5% VAT to your invoice total
              </p>
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-dark">
                  Invoice Items *
                </label>
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  disabled={loading}
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start p-4 bg-slate-50/50 rounded-xl">
                    <div className="flex-1">
                      <input
                        {...form.register(`items.${index}.description`)}
                        type="text"
                        placeholder="Description of goods/services"
                        className="w-full glass-input text-sm"
                        disabled={loading}
                      />
                    </div>
                    <div className="w-20">
                      <input
                        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Qty"
                        className="w-full glass-input text-sm text-center"
                        disabled={loading}
                      />
                    </div>
                    <div className="w-28">
                      <input
                        {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        className="w-full glass-input text-sm text-right"
                        disabled={loading}
                      />
                    </div>
                    <div className="w-24 text-sm font-medium text-slate-700 py-2">
                      {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0), selectedCurrency)}
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...form.register('notes')}
                rows={3}
                placeholder="Additional notes or payment terms..."
                className="w-full glass-input resize-none"
                disabled={loading}
              />
            </div>

            {/* Invoice Summary */}
            <div className="bg-slate-50/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal, selectedCurrency)}</span>
              </div>
              {includeVat && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">VAT (7.5%):</span>
                  <span className="font-medium">{formatCurrency(vatAmount, selectedCurrency)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-lg">{formatCurrency(totalAmount, selectedCurrency)}</span>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <p className="text-sm text-red-700 font-medium mb-2">Error Details:</p>
                <p className="text-sm text-red-600 break-words">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-2xl font-medium hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 glass-button-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 