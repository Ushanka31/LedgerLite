'use client';

import { useState, useEffect } from 'react';
import { personalIncomeCategories, personalExpenseCategories, getCategoryById } from '@/app/lib/personalCategories';
import AddPersonalIncomeModal from './AddPersonalIncomeModal';
import AddPersonalExpenseModal from './AddPersonalExpenseModal';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PersonalDashboard({ transactions = [], dateRange, onTransactionAdded }) {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Fetch budget data
  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await fetch('/api/personal/budget');
      const result = await response.json();
      
      if (result.success && result.budget) {
        setBudget(result.budget);
      }
    } catch (error) {
      console.error('Failed to fetch budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = (transaction) => {
    // Notify parent component to refresh data
    if (onTransactionAdded) {
      onTransactionAdded();
    }
  };

  // Calculate totals
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Group expenses by category
  const expensesByCategory = {};
  expenseTransactions.forEach(transaction => {
    // Extract category from reference or narration
    const categoryMatch = transaction.narration?.match(/^([^\s]+)\s+([^:]+):/);
    if (categoryMatch) {
      const categoryName = categoryMatch[2];
      const category = personalExpenseCategories.find(c => c.name === categoryName);
      if (category) {
        if (!expensesByCategory[category.id]) {
          expensesByCategory[category.id] = {
            category,
            amount: 0,
            count: 0
          };
        }
        expensesByCategory[category.id].amount += transaction.amount;
        expensesByCategory[category.id].count += 1;
      }
    }
  });

  // Sort categories by amount
  const sortedCategories = Object.values(expensesByCategory)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6); // Top 6 categories

  // Prepare chart data
  const categoryChartData = {
    labels: sortedCategories.map(c => c.category.name),
    datasets: [{
      data: sortedCategories.map(c => c.amount),
      backgroundColor: [
        '#10B981', // green
        '#F59E0B', // amber
        '#3B82F6', // blue
        '#8B5CF6', // violet
        '#EC4899', // pink
        '#EF4444', // red
      ],
      borderWidth: 0,
    }],
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-green-800">Add Income</p>
              <p className="text-sm text-green-600">Record earnings</p>
            </div>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors group"
          >
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <span className="text-2xl">💸</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-red-800">Add Expense</p>
              <p className="text-sm text-red-600">Track spending</p>
            </div>
          </button>

          <button
            onClick={() => document.querySelector('[data-action="budget"]')?.click()}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-blue-800">Set Budget</p>
              <p className="text-sm text-blue-600">Plan spending</p>
            </div>
          </button>

          <button
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
          >
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">📱</span>
            </div>
            <div className="text-left">
              <p className="font-medium text-purple-800">Connect Bank</p>
              <p className="text-sm text-purple-600">Coming soon</p>
            </div>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Income</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-slate-500 mt-1">{incomeTransactions.length} transactions</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Expenses</span>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">{expenseTransactions.length} transactions</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Net Savings</span>
            <span className="text-2xl">🏦</span>
          </div>
          <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(netSavings))}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {savingsRate.toFixed(1)}% savings rate
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Budget Status</span>
            <span className="text-2xl">📊</span>
          </div>
          {budget && budget.totalIncome > 0 ? (
            <>
              <p className="text-lg font-bold text-slate-800">
                {((totalExpenses / budget.totalIncome) * 100).toFixed(0)}% used
              </p>
              <p className="text-xs text-slate-500 mt-1">
                of {formatCurrency(budget.totalIncome)} budget
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No budget set</p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Breakdown</h3>
          {sortedCategories.length > 0 ? (
            <div className="h-64">
              <Doughnut 
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 10,
                        font: { size: 11 }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = formatCurrency(context.parsed);
                          const percentage = ((context.parsed / totalExpenses) * 100).toFixed(1);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-slate-500">No expense data to display</p>
            </div>
          )}
        </div>

        {/* Budget vs Actual */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Budget vs Actual</h3>
          {budget && budget.budgets.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {budget.budgets.map(budgetItem => {
                const category = getCategoryById(budgetItem.categoryId, 'expense');
                const actual = expensesByCategory[budgetItem.categoryId]?.amount || 0;
                const percentage = budgetItem.amount > 0 ? (actual / budgetItem.amount) * 100 : 0;
                
                return (
                  <div key={budgetItem.categoryId} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span>{category?.icon}</span>
                        <span className="font-medium">{category?.name}</span>
                      </span>
                      <span className="text-xs text-slate-600">
                        {formatCurrency(actual)} / {formatCurrency(budgetItem.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          percentage > 100 ? 'bg-red-500' : 
                          percentage > 80 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-500 mb-3">No budget set</p>
                <button 
                  onClick={() => document.querySelector('[data-action="budget"]')?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Set up your budget
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.slice(0, 10).map((transaction, index) => {
            const isIncome = transaction.type === 'income';
            const categoryMatch = transaction.narration?.match(/^([^\s]+)\s+([^:]+):/);
            const icon = categoryMatch ? categoryMatch[1] : isIncome ? '💰' : '💸';
            const description = transaction.narration?.replace(/^[^\s]+\s+[^:]+:\s*/, '') || transaction.description;
            
            return (
              <div key={transaction.id || index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
          
          {transactions.length === 0 && (
            <p className="text-center text-slate-500 py-8">No transactions found</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPersonalIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={handleTransactionSuccess}
      />

      <AddPersonalExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
} 