// Centralized category definitions
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Insurance',
  'Education',
  'Travel',
  'Personal Care',
  'Home & Rent',
  'Subscriptions',
  'Other'
];

export const getCategoryIcon = (category) => {
  const icons = {
    'Food': '🍔',
    'Transportation': '🚗',
    'Utilities': '💡',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Healthcare': '⚕️',
    'Insurance': '🛡️',
    'Education': '📚',
    'Travel': '✈️',
    'Personal Care': '💇',
    'Home & Rent': '🏠',
    'Subscriptions': '📱',
    'Other': '📌'
  };
  return icons[category] || '📌';
};
