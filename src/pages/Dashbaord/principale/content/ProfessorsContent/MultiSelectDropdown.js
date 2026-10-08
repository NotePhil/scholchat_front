import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleSelect = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
    setQuery("");
  };
  const filteredOptions = options.filter((option) =>
    option.nom.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full px-4 py-3 border rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all duration-200 ${error ? "border-red-300" : "border-slate-200"}`}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : "Ajouter une matière..."}
          className="w-full outline-none placeholder:text-slate-400 text-slate-900"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-4 py-3 text-slate-400 text-center text-sm">
              Tapez pour rechercher une matière...
            </div>
          ) : (
            <>
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${selected.includes(option.id) ? "bg-indigo-50 text-indigo-900" : "text-slate-700"}`}
                >
                  <span>{option.nom}</span>
                  {selected.includes(option.id) && (
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="w-4 h-4 text-indigo-600"
                    />
                  )}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-4 py-3 text-slate-500 text-center">
                  {options.length === 0
                    ? "Aucune matière disponible"
                    : "Aucun résultat"}
                </div>
              )}
            </>
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
                  <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};
export default MultiSelectDropdown;
