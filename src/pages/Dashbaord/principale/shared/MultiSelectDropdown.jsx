// MultiSelectDropdown.jsx
import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder,
  error,
  onSelectAll,
  selectAllLabel = "Sélectionner tout",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) =>
    (option.name || option.id)
      .toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <div
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer ${
          error ? "border-red-300" : "border-slate-200"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-500">
            {selected.length > 0
              ? `${selected.length} sélectionné(s)`
              : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {onSelectAll && (
            <div
              className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
              onClick={onSelectAll}
            >
              <input
                type="checkbox"
                checked={
                  selected.length === options.length && options.length > 0
                }
                readOnly
                className="mr-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{selectAllLabel}</span>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleOption(option.id)}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    readOnly
                    className="mr-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">
                    {option.name || `Participant ${option.id}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                Aucun résultat trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
