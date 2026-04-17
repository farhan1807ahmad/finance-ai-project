import React, { useState } from 'react';
import './ExpenseFilter.css';

function ExpenseFilter({ onFilterChange, expenses = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [amountRange, setAmountRange] = useState('all');

  // Extract unique categories from expenses
  const categories = ['all', ...new Set(expenses.map(e => e.category))];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(value, selectedCategory, dateRange, amountRange);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    applyFilters(searchTerm, value, dateRange, amountRange);
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRange(value);
    applyFilters(searchTerm, selectedCategory, value, amountRange);
  };

  const handleAmountRangeChange = (e) => {
    const value = e.target.value;
    setAmountRange(value);
    applyFilters(searchTerm, selectedCategory, dateRange, value);
  };

  const applyFilters = (search, category, date, amount) => {
    let filtered = expenses;

    // Search filter
    if (search) {
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(e => e.category === category);
    }

    // Date range filter
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    if (date === 'today') {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.toDateString() === today.toDateString();
      });
    } else if (date === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => new Date(e.date) >= weekAgo);
    } else if (date === 'month') {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfMonth;
      });
    } else if (date === 'year') {
      filtered = filtered.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfYear;
      });
    }

    // Amount range filter
    if (amount === 'small') {
      filtered = filtered.filter(e => e.amount < 100);
    } else if (amount === 'medium') {
      filtered = filtered.filter(e => e.amount >= 100 && e.amount < 500);
    } else if (amount === 'large') {
      filtered = filtered.filter(e => e.amount >= 500);
    }

    onFilterChange(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setDateRange('all');
    setAmountRange('all');
    onFilterChange(expenses);
  };

  return (
    <div className="expense-filter">
      <div className="filter-header">
        <h3>🔍 Filter Expenses</h3>
        {(searchTerm || selectedCategory !== 'all' || dateRange !== 'all' || amountRange !== 'all') && (
          <button className="reset-btn" onClick={handleReset}>
            Reset Filters
          </button>
        )}
      </div>

      <div className="filter-grid">
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="search">Search Description</label>
          <input
            id="search"
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="filter-input"
          />
        </div>

        {/* Category Filter */}
        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label htmlFor="dateRange">Date Range</label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={handleDateRangeChange}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Amount Filter */}
        <div className="filter-group">
          <label htmlFor="amount">Amount Range</label>
          <select
            id="amount"
            value={amountRange}
            onChange={handleAmountRangeChange}
            className="filter-select"
          >
            <option value="all">All Amounts</option>
            <option value="small">Under $100</option>
            <option value="medium">$100 - $500</option>
            <option value="large">$500+</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default ExpenseFilter;
