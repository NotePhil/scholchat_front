import React, { useState, useEffect } from "react";

const COUNTRY_CODES = {
  CM: {
    code: "+237",
    abbr: "CM",
    regex: /^(6|2)\d{7}$/, // Changed to 8 digits total (first digit + 7 more)
    maxLength: 8, // Changed from 9 to 8
    format: [1, 3, 4], // Updated format pattern for 8 digits
    example: "65413956", // Updated example with 8 digits
    description: "Must start with 6 (mobile) or 2 (fixed), total 8 digits",
  },
  US: {
    code: "+1",
    abbr: "US",
    regex: /^\d{10}$/,
    maxLength: 10,
    format: [3, 3, 4],
    example: "2125551234",
    description: "10 digits required",
  },
  FR: {
    code: "+33",
    abbr: "FR",
    regex: /^[1-9]\d{8}$/, // Updated to match backend: must start with 1-9 + 8 more digits
    maxLength: 9,
    format: [1, 2, 2, 2, 2],
    example: "123456789", // Updated example
    description: "Must start with 1-9, total 9 digits",
  },
  NG: {
    code: "+234",
    abbr: "NG",
    regex: /^[789]\d{9}$/,
    maxLength: 10,
    format: [3, 3, 4],
    example: "8012345678",
    description: "Must start with 7, 8, or 9, total 10 digits",
  },
};

const PhoneInputs = ({
  value = "",
  onChange = () => {},
  onCountryChange = () => {},
  error = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState("CM");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [helper, setHelper] = useState("");

  useEffect(() => {
    const currentCountryCode = COUNTRY_CODES[selectedCountry];
    const formattedValue = phoneNumber
      ? `${currentCountryCode.code} ${phoneNumber}`
      : "";
    onChange(formattedValue || "");
  }, [phoneNumber, selectedCountry, onChange]);

  const validatePhoneNumber = (number, country) => {
    const countryRules = COUNTRY_CODES[country];
    const digitsOnly = number.replace(/\D/g, "");

    if (!digitsOnly) {
      setHelper("");
      setIsValid(true);
      return true;
    }

    const isValidLength = digitsOnly.length === countryRules.maxLength;
    const matchesPattern = countryRules.regex.test(digitsOnly);

    if (country === "CM") {
      const firstDigit = digitsOnly.charAt(0);
      if (firstDigit !== "6" && firstDigit !== "2") {
        setIsValid(false);
        setHelper("Cameroon numbers must start with 6 (mobile) or 2 (fixed)");
        return false;
      }
    } else if (country === "FR") {
      const firstDigit = digitsOnly.charAt(0);
      if (firstDigit === "0") {
        setIsValid(false);
        setHelper("Without country code, France numbers should start with 1-9");
        return false;
      }
    }

    setIsValid(isValidLength && matchesPattern);
    setHelper(
      isValidLength && matchesPattern
        ? "Valid number"
        : `${countryRules.description}`
    );

    return isValidLength && matchesPattern;
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
    setPhoneNumber("");
    setHelper("");
    setIsValid(true);
    onCountryChange(e.target.value);
  };

  const formatPhoneNumber = (number, formatPattern) => {
    let formatted = "";
    let index = 0;
    for (let part of formatPattern) {
      if (index + part > number.length) {
        formatted += number.slice(index);
        break;
      }
      formatted += number.slice(index, index + part) + " ";
      index += part;
    }
    return formatted.trim();
  };

  const handlePhoneChange = (input) => {
    if (!input) {
      setPhoneNumber("");
      setHelper("");
      setIsValid(true);
      return;
    }

    const digitsOnly = input.replace(/\D/g, "");
    const currentCountryCode = COUNTRY_CODES[selectedCountry];
    const limitedDigits = digitsOnly.slice(0, currentCountryCode.maxLength);
    const formattedNumber = formatPhoneNumber(
      limitedDigits,
      currentCountryCode.format
    );

    setPhoneNumber(formattedNumber);
    validatePhoneNumber(limitedDigits, selectedCountry);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <div
        className={`flex items-center border rounded-lg p-3 ${
          !isValid ? "border-red-500" : "border-gray-300"
        }`}
      >
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          className="w-28 p-2 text-sm border-none bg-gray-50 rounded-md mr-2"
        >
          {Object.entries(COUNTRY_CODES).map(([code, details]) => (
            <option key={code} value={code}>
              {details.abbr} ({details.code})
            </option>
          ))}
        </select>

        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className="flex-1 p-2 bg-transparent outline-none"
          placeholder="Enter phone number"
          maxLength={
            COUNTRY_CODES[selectedCountry].maxLength +
            COUNTRY_CODES[selectedCountry].format.length
          }
        />
      </div>

      {helper && (
        <p className={`text-sm ${isValid ? "text-green-600" : "text-red-500"}`}>
          {helper}
        </p>
      )}

      {selectedCountry === "CM" && (
        <p className="text-xs text-gray-500">Example: +237 6541 3956</p>
      )}
      {selectedCountry === "FR" && (
        <p className="text-xs text-gray-500">Example: +33 1 23 45 67 89</p>
      )}
    </div>
  );
};

export default PhoneInputs;
