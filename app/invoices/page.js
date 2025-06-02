'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // Track loading for individual actions
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoice: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        const result = await response.json();
        
        if (result.success) {
          setUser(result.user);
        } else {
          console.error('Failed to fetch user:', result.error);
          if (response.status === 401) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch invoices
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices?limit=50');
      const result = await response.json();
      
      if (result.success) {
        setInvoices(result.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [invoiceId]: true }));
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the invoice in the local state
        setInvoices(prev => prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: newStatus }
            : invoice
        ));
        
        // Show success message
        alert(`Invoice ${newStatus === 'sent' ? 'sent' : 'updated'} successfully!`);
      } else {
        throw new Error(result.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert(`Failed to update invoice: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  const deleteInvoice = async (invoiceId) => {
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the invoice from the local state
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
        
        // Close modal and show success message
        setDeleteModal({ isOpen: false, invoice: null });
        alert('Invoice deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert(`Failed to delete invoice: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (invoice) => {
    setDeleteModal({ isOpen: true, invoice });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.invoice) {
      deleteInvoice(deleteModal.invoice.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, invoice: null });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'draft':
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const renderActions = (invoice) => {
    const isLoading = actionLoading[invoice.id];
    
    if (invoice.status === 'draft') {
      return (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Invoice'}
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => alert(`View invoice ${invoice.invoiceNumber} - Feature coming soon!`)}
            className="text-slate-600 hover:text-slate-700 text-sm font-medium"
          >
            View
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => handleDeleteClick(invoice)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      );
    }
    
    if (invoice.status === 'sent') {
      return (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Mark Paid'}
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => alert(`View invoice ${invoice.invoiceNumber} - Feature coming soon!`)}
            className="text-slate-600 hover:text-slate-700 text-sm font-medium"
          >
            View
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => handleDeleteClick(invoice)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      );
    }
    
    // For paid, overdue, cancelled invoices
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => alert(`View invoice ${invoice.invoiceNumber} - Feature coming soon!`)}
          className="text-slate-600 hover:text-slate-700 text-sm font-medium"
        >
          View Details
        </button>
        <span className="text-slate-300">•</span>
        <button
          onClick={() => handleDeleteClick(invoice)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <EnhancedNavbar 
        user={user}
        setupProgress={100}
        syncStatus="synced"
        lastSync="now"
      />

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
                <p className="text-slate-600 mt-1">
                  Manage and track all your invoices
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-light"
                >
                  ← Dashboard
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-primary"
                >
                  + New Invoice
                </button>
              </div>
            </div>

            {/* Revenue Workflow Info Banner */}
            <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Revenue Recognition</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Revenue only appears in your dashboard when invoices are marked as <span className="font-semibold">"Paid"</span>. 
                    Use the "Send Invoice" button for draft invoices, then "Mark Paid" when payment is received.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="glass-card">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No invoices yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create your first invoice to start billing customers
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-primary mt-4"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Invoice</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Customer</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Date</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Due Date</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">
                            {invoice.invoiceNumber}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {invoice.customerName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                            </div>
                            <span className="font-medium text-slate-800">
                              {invoice.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(invoice.totalAmount)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {renderActions(invoice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Delete Invoice</h3>
                <p className="text-sm text-slate-600">
                  {deleteModal.invoice?.invoiceNumber}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700 mb-3">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Revenue Impact</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {deleteModal.invoice?.status === 'paid' 
                        ? `Deleting this invoice will remove ${formatCurrency(deleteModal.invoice?.totalAmount)} from your revenue.`
                        : 'This invoice has not contributed to revenue yet, so no revenue will be affected.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="glass-button-light disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 