// Common business currencies for expense management
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

export const formatAmount = (amount: number, currencyCode: string = 'GBP'): string => {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) {
    // Fallback to GBP if currency not found
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  }

  // Use appropriate locale based on currency
  const locales: Record<string, string> = {
    'GBP': 'en-GB',
    'USD': 'en-US',
    'EUR': 'en-DE',
    'CAD': 'en-CA',
    'AUD': 'en-AU',
    'JPY': 'ja-JP',
    'CHF': 'de-CH',
    'CNY': 'zh-CN',
    'INR': 'en-IN',
    'SGD': 'en-SG',
  };

  const locale = locales[currencyCode] || 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};