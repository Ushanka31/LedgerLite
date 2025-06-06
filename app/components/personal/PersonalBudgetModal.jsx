'use client';

import { useState, useEffect } from 'react';
import { personalExpenseCategories, personalBudgetPresets, getCategoriesByGroup, getAllGroups } from '@/app/lib/personalCategories';

export default function PersonalBudgetModal({ isOpen, onClose, onSuccess }) {
  const [budgetType, setBudgetType] = useState('custom'); // custom, conservative, moderate, aggressive
  const [totalIncome, setTotalIncome] = useState('');
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const groups = getAllGroups();

  // Initialize budgets with all categories
  useEffect(() => {
    const initialBudgets = {};
    personalExpenseCategories.forEach(category => {
      initialBudgets[category.id] = { amount: 0, percentage: 0 };
    });
    setBudgets(initialBudgets);
  }, []);

  // Apply preset when budget type changes
  useEffect(() => {
    if (budgetType !== 'custom' && totalIncome) {
      applyPreset(budgetType);
    }
  }, [budgetType, totalIncome]);

  const applyPreset = (presetType) => {
    const preset = personalBudgetPresets[presetType];
    if (!preset || !totalIncome) return;

    const income = parseFloat(totalIncome);
    const newBudgets = {};

    // Map preset percentages to categories
    personalExpenseCategories.forEach(category => {
      let percentage = 0;
      
      // Map category groups to preset categories
      switch (category.group) {
        case 'Housing':
          if (category.id === 'rent' || category.id === 'mortgage') {
            percentage = preset.housing * 0.7; // 70% of housing budget
          } else if (category.id === 'utilities') {
            percentage = preset.utilities;
          } else {
            percentage = preset.housing * 0.3 / 2; // Split remaining 30%
          }
          break;
        case 'Transportation':
          percentage = preset.transportation / 4; // Split equally
          break;
        case 'Food':
          percentage = preset.food / 3; // Split equally
          break;
        case 'Personal':
          percentage = preset.personal / 4; // Split equally
          break;
        case 'Lifestyle':
          percentage = preset.entertainment / 4; // Split equally
          break;
        case 'Financial':
          if (category.id === 'insurance') {
            percentage = preset.insurance;
          } else if (category.id === 'savings') {
            percentage = preset.savings;
          } else {
            percentage = 2; // Small percentage for other financial
          }
          break;
        default:
          percentage = preset.other / 4; // Split other
      }

      const amount = (income * percentage) / 100;
      newBudgets[category.id] = { amount, percentage };
    });

    setBudgets(newBudgets);
  };

  const handleBudgetChange = (categoryId, value, isPercentage = false) => {
    const income = parseFloat(totalIncome) || 0;
    
    if (isPercentage && income > 0) {
      const percentage = parseFloat(value) || 0;
      const amount = (income * percentage) / 100;
      setBudgets(prev => ({
        ...prev,
        [categoryId]: { amount, percentage }
      }));
    } else {
      const amount = parseFloat(value) || 0;
      const percentage = income > 0 ? (amount / income) * 100 : 0;
      setBudgets(prev => ({
        ...prev,
        [categoryId]: { amount, percentage }
      }));
    }
    
    // Switch to custom if user modifies values
    if (budgetType !== 'custom') {
      setBudgetType('custom');
    }
  };

  const calculateTotalBudget = () => {
    return Object.values(budgets).reduce((sum, budget) => sum + budget.amount, 0);
  };

  const calculateTotalPercentage = () => {
    return Object.values(budgets).reduce((sum, budget) => sum + budget.percentage, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format budgets for API
      const budgetData = Object.entries(budgets)
        .filter(([_, budget]) => budget.amount > 0)
        .map(([categoryId, budget]) => ({
          categoryId,
          amount: budget.amount,
          percentage: budget.percentage
        }));

      const response = await fetch('/api/personal/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIncome: parseFloat(totalIncome),
          budgetType,
          budgets: budgetData
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) onSuccess(result.budget);
        handleClose();
      } else {
        setError(result.error || 'Failed to save budget');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTotalIncome('');
    setBudgetType('custom');
    setBudgets({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const totalBudget = calculateTotalBudget();
  const totalPercentage = calculateTotalPercentage();
  const income = parseFloat(totalIncome) || 0;
  const remaining = income - totalBudget;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200/50">
          <h2 className="text-xl font-semibold">Personal Budget Planner</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Income and Budget Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monthly Income (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={totalIncome}
                onChange={(e) => setTotalIncome(e.target.value)}
                className="glass-input w-full"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Budget Template
              </label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                className="glass-input w-full"
              >
                <option value="custom">Custom Budget</option>
                <option value="conservative">Conservative (20% Savings)</option>
                <option value="moderate">Moderate (10% Savings)</option>
                <option value="aggressive">Aggressive (30% Savings)</option>
              </select>
            </div>
          </div>

          {/* Budget Summary */}
          {income > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Total Income</p>
                  <p className="font-semibold text-lg">₦{income.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-600">Total Budgeted</p>
                  <p className="font-semibold text-lg">₦{totalBudget.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{totalPercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-slate-600">Remaining</p>
                  <p className={`font-semibold text-lg ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Budgets */}
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-medium text-slate-800 mb-3">{group}</h3>
                <div className="space-y-3">
                  {getCategoriesByGroup(group).map(category => (
                    <div key={category.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={budgets[category.id]?.amount || ''}
                          onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                          className="glass-input w-full text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={budgets[category.id]?.percentage || ''}
                          onChange={(e) => handleBudgetChange(category.id, e.target.value, true)}
                          className="glass-input w-20 text-sm"
                          placeholder="0"
                          disabled={!income}
                        />
                        <span className="text-sm text-slate-600">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 sticky bottom-0 bg-white/95 backdrop-blur-sm py-4">
            <button
              type="button"
              onClick={handleClose}
              className="glass-button flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button flex-1"
              disabled={loading || !totalIncome}
            >
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 