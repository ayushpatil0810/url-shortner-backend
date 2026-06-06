import ms, { type StringValue } from 'ms';
import AppError from './AppError.js';

// Converts a time string (e.g., "1h", "30m") to milliseconds
const msConverter = (value: StringValue): number => {
  const convertedValue = ms(value);
  if (typeof convertedValue === 'undefined') {
    throw new AppError(`Invalid time format: ${value}`, 400);
  }
  return convertedValue;
};

export default msConverter;
