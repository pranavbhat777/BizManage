import { formatIndianCurrency, formatIndianWithUnits, formatCurrencyWithSign } from './currencyFormat';

// Test Indian Currency Formatting
console.log('🇮🇳 Indian Currency Formatting Examples:\n');

// Basic formatting
console.log('Basic Formatting:');
console.log('1000 →', formatIndianCurrency(1000));           // ₹1,000
console.log('10000 →', formatIndianCurrency(10000));         // ₹10,000
console.log('100000 →', formatIndianCurrency(100000));       // ₹1,00,000 (1 lakh)
console.log('1000000 →', formatIndianCurrency(1000000));     // ₹10,00,000 (10 lakhs)
console.log('10000000 →', formatIndianCurrency(10000000));   // ₹1,00,00,000 (1 crore)
console.log('100000000 →', formatIndianCurrency(100000000)); // ₹10,00,00,000 (10 crores)

console.log('\nWith Signs:');
console.log('50000 (in) →', formatCurrencyWithSign(50000, 'in'));  // +₹50,000
console.log('50000 (out) →', formatCurrencyWithSign(50000, 'out')); // -₹50,000

console.log('\nWith Units:');
console.log('50000 →', formatIndianWithUnits(50000));       // ₹50.00 K
console.log('500000 →', formatIndianWithUnits(500000));     // ₹5.00 L
console.log('5000000 →', formatIndianWithUnits(5000000));   // ₹50.00 L
console.log('50000000 →', formatIndianWithUnits(50000000));  // ₹5.00 Cr
console.log('500000000 →', formatIndianWithUnits(500000000)); // ₹50.00 Cr

console.log('\nDecimal Numbers:');
console.log('1234.56 →', formatIndianCurrency(1234.56));      // ₹1,234.56
console.log('123456.78 →', formatIndianCurrency(123456.78)); // ₹1,23,456.78

console.log('\nNegative Numbers:');
console.log('-1000 →', formatIndianCurrency(-1000));         // -₹1,000
console.log('-100000 →', formatIndianCurrency(-100000));     // -₹1,00,000

console.log('\nComparison with Western System:');
console.log('Western: 1,000,000 = 1 million');
console.log('Indian:  10,00,000 = 10 lakhs');
console.log('Western: 10,000,000 = 10 million');
console.log('Indian:  1,00,00,000 = 1 crore');

export default {};
