import { isValidPhoneNumber } from "react-phone-number-input";

/**
 * Same rule as the backend (UserValidationService): valid per libphonenumber, or — for Cameroon —
 * any 9-digit national number starting with 2 or 6 (operators open new ranges such as 64x before
 * the phone metadata lists them).
 */
export const isAcceptedPhoneNumber = (value) => {
  if (!value) return false;
  if (isValidPhoneNumber(value)) return true;
  return /^\+237[26]\d{8}$/.test(String(value).replace(/\s/g, ""));
};
