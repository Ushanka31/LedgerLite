'use client';

import { useState, useEffect, useRef } from 'react';

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'YTD', value: 'ytd' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

export default function DateRangeSelector({ 
  selected = 'all', 
  onSelect, 
  customDateRange = null, 
  onCustomDateChange = null 
}) {
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCustomPickerOpen(false);
      }
    };

    if (isCustomPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomPickerOpen]);

  // Initialize temp dates when opening picker
  useEffect(() => {
    if (isCustomPickerOpen && customDateRange) {
      setTempStartDate(customDateRange.start || '');
      setTempEndDate(customDateRange.end || '');
    }
  }, [isCustomPickerOpen, customDateRange]);

  const handleRangeClick = (value) => {
    if (value === 'custom') {
      // Always open the picker when clicking custom
      setIsCustomPickerOpen(true);
      // Only select custom if we don't already have it selected
      if (selected !== 'custom') {
        onSelect('custom');
      }
    } else {
      // For non-custom ranges, just select them
      setIsCustomPickerOpen(false);
      onSelect(value);
    }
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      
      if (start <= end) {
        onCustomDateChange({
          start: tempStartDate,
          end: tempEndDate
        });
        setIsCustomPickerOpen(false);
      } else {
        alert('Start date must be before or equal to end date');
      }
    }
  };

  const handleCancel = () => {
    setIsCustomPickerOpen(false);
    setTempStartDate('');
    setTempEndDate('');
  };

  const applyPreset = (days) => {
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    
    setTempStartDate(startStr);
    setTempEndDate(endStr);
  };

  const getButtonLabel = (range) => {
    if (range.value === 'custom' && selected === 'custom' && customDateRange?.start && customDateRange?.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      };
      
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return range.label;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Date range buttons */}
      <div className="flex items-center gap-1 glass-card-subtle p-1 rounded-xl">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeClick(range.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              selected === range.value
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'
            }`}
          >
            {getButtonLabel(range)}
          </button>
        ))}
      </div>

      {/* Custom date picker dropdown */}
      {isCustomPickerOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 glass-card p-4 rounded-xl shadow-lg min-w-[320px]">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Select Date Range</h3>
          
          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full glass-input text-sm py-2"
                max={tempEndDate || undefined}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full glass-input text-sm py-2"
                min={tempStartDate || undefined}
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Quick presets:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset(7)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => applyPreset(30)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => applyPreset(90)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Last 90 days
              </button>
              <button
                onClick={() => applyPreset(365)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Last year
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 