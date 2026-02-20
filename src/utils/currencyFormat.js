/**
 * Indian Currency Formatter
 * Formats numbers according to Indian system of numeration
 * Uses lakhs (1,00,000) and crores (1,00,00,000) instead of thousands/millions
 */

/**
 * Format number according to Indian system of numeration
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show ₹ symbol
 * @returns {string} Formatted Indian currency string
 */
export const formatIndianCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  const num = Math.abs(Number(amount));
  
  // Handle numbers less than 1000
  if (num < 1000) {
    return showSymbol ? `₹${amount.toLocaleString('en-IN')}` : amount.toLocaleString('en-IN');
  }
  
  // Convert to string for processing
  let str = num.toString();
  let result = '';
  
  // Handle decimal part
  let decimalPart = '';
  if (str.includes('.')) {
    const parts = str.split('.');
    str = parts[0];
    decimalPart = '.' + parts[1];
  }
  
  // Apply Indian formatting
  if (str.length <= 3) {
    result = str;
  } else if (str.length <= 5) {
    // Thousands: 1,000 to 99,999
    result = str.slice(0, -3) + ',' + str.slice(-3);
  } else {
    // Lakhs and above: 1,00,000 and above
    // First three digits from right
    const lastThree = str.slice(-3);
    const remaining = str.slice(0, -3);
    
    // Format remaining part in groups of two
    let remainingFormatted = '';
    for (let i = remaining.length - 1; i >= 0; i--) {
      remainingFormatted = remaining[i] + remainingFormatted;
      if ((remaining.length - i) % 2 === 0 && i !== 0) {
        remainingFormatted = ',' + remainingFormatted;
      }
    }
    
    result = remainingFormatted + ',' + lastThree;
  }
  
  // Add decimal part back
  result += decimalPart;
  
  // Add sign and symbol
  const sign = amount < 0 ? '-' : '';
  const symbol = showSymbol ? '₹' : '';
  
  return sign + symbol + result;
};

/**
 * Format currency for display in tables and cards
 * @param {number} amount - The amount to format
 * @param {string} type - 'in' or 'out' for adding + or - sign
 * @returns {string} Formatted currency with sign
 */
export const formatCurrencyWithSign = (amount, type) => {
  const formatted = formatIndianCurrency(amount, false);
  const sign = type === 'in' ? '+' : '-';
  return sign + '₹' + formatted;
};

/**
 * Format large amounts with Indian units (Lakhs, Crores)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount with units
 */
export const formatIndianWithUnits = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const absAmount = Math.abs(Number(amount));
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 10000000) {
    // Crores: 1,00,00,000 and above
    const crores = absAmount / 10000000;
    return `${sign}₹${crores.toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs: 1,00,000 to 99,99,999
    const lakhs = absAmount / 100000;
    return `${sign}₹${lakhs.toFixed(2)} L`;
  } else {
    // Less than 1 lakh
    return formatIndianCurrency(amount);
  }
};

/**
 * Parse Indian formatted currency back to number
 * @param {string} formattedString - The formatted currency string
 * @returns {number} The numeric value
 */
export const parseIndianCurrency = (formattedString) => {
  if (!formattedString || typeof formattedString !== 'string') {
    return 0;
  }
  
  // Remove ₹ symbol, commas, and spaces
  const cleanString = formattedString.replace(/[₹,\s]/g, '');
  
  // Convert to number
  const num = parseFloat(cleanString);
  
  return isNaN(num) ? 0 : num;
};

export default {
  formatIndianCurrency,
  formatCurrencyWithSign,
  formatIndianWithUnits,
  parseIndianCurrency
};
