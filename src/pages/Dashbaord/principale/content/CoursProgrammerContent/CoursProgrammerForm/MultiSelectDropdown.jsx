import React, { useState } from "react";
import { ChevronDown, Users, Check } from "lucide-react";

const MultiSelectDropdown = ({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
  error,
  onSelectAll,
  disabled = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <div
        className={`w-full px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
          error
            ? "border-red-300 bg-red-50"
            : "border-slate-200 hover:border-slate-300"
        } ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:bg-slate-50"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-1">
          <Users size={18} className="text-slate-400 mr-3 flex-shrink-0" />
          {loading ? (
            <span className="text-slate-400 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-2"></div>
              Chargement...
            </span>
          ) : selected.length > 0 ? (
            <span className="text-slate-700 font-medium">
              {selected.length} participant(s) sélectionné(s)
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {options.length > 0 && (
            <div
              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 transition-colors flex items-center"
              onClick={onSelectAll}
            >
              <Check size={16} className="text-indigo-600 mr-3" />
              <span className="font-medium text-indigo-700">
                {selected.length === options.length
                  ? "Désélectionner tout"
                  : "Sélectionner tout"}
              </span>
            </div>
          )}
          {options.map((option) => (
            <div
              key={option.id}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center transition-colors"
              onClick={() => handleToggle(option.id)}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => {}}
                className="mr-3 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-slate-700">{option.name}</span>
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-slate-400 flex items-center">
              <Users size={16} className="mr-2" />
              Aucun participant disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
