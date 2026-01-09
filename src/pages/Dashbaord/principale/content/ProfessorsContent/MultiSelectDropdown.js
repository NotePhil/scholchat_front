import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckCircle, X } from "lucide-react";

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  const getSelectedLabels = () => {
    return options
      .filter((option) => selected.includes(option.id))
      .map((option) => option.nom)
      .join(", ");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-left flex items-center justify-between ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <span
          className={
            selected.length === 0 ? "text-slate-400" : "text-slate-900"
          }
        >
          {selected.length === 0 ? placeholder : getSelectedLabels()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                selected.includes(option.id)
                  ? "bg-indigo-50 text-indigo-900"
                  : "text-slate-700"
              }`}
            >
              <span>{option.nom}</span>
              {selected.includes(option.id) && (
                <CheckCircle className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-slate-500 text-center">
              Aucune matière disponible
            </div>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {options
            .filter((option) => selected.includes(option.id))
            .map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
              >
                {option.nom}
                <button
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className="ml-2 hover:text-indigo-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
