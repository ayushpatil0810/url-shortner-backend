import ms, { type StringValue } from "ms";

// Converts a time string (e.g., "1h", "30m") to milliseconds
const msConverter = (value: StringValue): number => {
  const convertedValue = ms(value);
  if (typeof convertedValue === "undefined") {
    throw new Error(`Invalid time format: ${value}`);
  }
  return convertedValue;
};

export default msConverter;
