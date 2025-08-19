import React from 'react';
import { CURRENCIES, Currency } from '../../lib/currencies';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  label?: string;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  label = 'Currency',
  className = ''
}) => {
  return (
    <div className={className}>
      <label htmlFor="currency" className="flex items-center text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        id="currency"
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
      >
        {CURRENCIES.map((currency: Currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;