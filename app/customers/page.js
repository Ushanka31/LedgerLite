'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
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

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      
      if (result.success) {
        setCustomers(result.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
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
                <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
                <p className="text-slate-600 mt-1">
                  Manage your customer relationships and contact information
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
                  onClick={() => alert('Add customer feature - use dashboard quick actions for now')}
                  className="glass-button-primary"
                >
                  + Add Customer
                </button>
              </div>
            </div>
          </div>

          {/* Customers List */}
          <div className="glass-card">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No customers yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Add customers to start building your business relationships
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
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Customer</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Email</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Phone</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Added</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getAvatarColor(customer.name)} rounded-full flex items-center justify-center text-white font-semibold`}>
                              {getInitials(customer.name)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {customer.name}
                              </div>
                              {customer.company && (
                                <div className="text-sm text-slate-500">
                                  {customer.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-700">
                              {customer.email}
                            </a>
                          ) : (
                            <span className="text-slate-400">No email</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {customer.phone ? (
                            <a href={`tel:${customer.phone}`} className="text-slate-600 hover:text-slate-800">
                              {customer.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert(`Customer details for ${customer.name} - Feature coming soon!`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => alert(`Edit ${customer.name} - Feature coming soon!`)}
                              className="text-slate-600 hover:text-slate-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
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
    </div>
  );
} 