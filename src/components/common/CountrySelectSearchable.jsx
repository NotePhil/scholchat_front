import React, { useState, useRef, useEffect, useMemo } from "react";
import { getCountryCallingCode } from "react-phone-number-input";
import getUnicodeFlagIcon from "country-flag-icons/unicode";
import "./CountrySelectSearchable.css";

/**
 * Custom country selector for react-phone-number-input (wired via its
 * `countrySelectComponent` prop). Replaces the library's default invisible
 * native <select> (which relies on the OS picker and can't be searched) with
 * a proper dropdown: flag + country name + dial code, filterable by either.
 *
 * Flags are rendered as Unicode flag emoji (via country-flag-icons/unicode)
 * instead of the library's default behavior of loading each flag as an
 * external SVG <img> from a GitHub Pages URL — that's what was actually
 * causing flags to not display (no network access to that host, or it being
 * slow/blocked). Emoji flags need no network request and no bundle weight.
 *
 * Props come from react-phone-number-input's PhoneInputWithCountry:
 * value (2-letter country code or undefined for "International"),
 * options ({value, label, divider}[]), onChange, onFocus, onBlur,
 * disabled, readOnly, name, aria-label.
 */
const CountrySelectSearchable = ({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  name,
  // Swallowed: react-phone-number-input passes these through for its default
  // countrySelectComponent (CountrySelectWithIcon) to consume — this custom
  // replacement renders its own flag/arrow, so they'd otherwise leak onto
  // the <button> as unrecognized DOM attributes.
  iconComponent: _iconComponent,
  getIconAspectRatio: _getIconAspectRatio,
  arrowComponent: _arrowComponent,
  unicodeFlags: _unicodeFlags,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const realOptions = useMemo(() => options.filter((o) => !o.divider), [options]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return realOptions;
    return realOptions.filter((o) => {
      const name = (o.label || "").toLowerCase();
      const dial = o.value ? getCountryCallingCode(o.value) : "";
      return name.includes(q) || dial.includes(q);
    });
  }, [search, realOptions]);

  const selected = realOptions.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    // Decide whether the panel has room to open downward; flip upward
    // otherwise instead of getting clipped off-screen.
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320 && rect.top > spaceBelow);
    }
    const id = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  const handleToggle = () => {
    if (disabled || readOnly) return;
    setOpen((o) => !o);
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="PhoneInputCountry PhoneInputCountry--searchable" ref={containerRef}>
      <button
        type="button"
        name={name}
        className="CountrySelectSearchable-trigger"
        onClick={handleToggle}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled || readOnly}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...rest}
      >
        <span className="CountrySelectSearchable-flag" aria-hidden="true">
          {selected && selected.value ? getUnicodeFlagIcon(selected.value) : "🌐"}
        </span>
        <span className="PhoneInputCountrySelectArrow" />
      </button>

      {open && (
        <div
          className={`CountrySelectSearchable-dropdown ${
            openUpward ? "CountrySelectSearchable-dropdown--up" : ""
          }`}
          role="listbox"
        >
          <input
            ref={searchInputRef}
            type="text"
            className="CountrySelectSearchable-search"
            placeholder="Rechercher un pays ou un indicatif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          <div className="CountrySelectSearchable-list">
            {filteredOptions.length === 0 && (
              <div className="CountrySelectSearchable-empty">Aucun pays trouvé</div>
            )}
            {filteredOptions.map((opt) => (
              <button
                type="button"
                key={opt.value || "ZZ"}
                className={`CountrySelectSearchable-option ${
                  opt.value === value ? "CountrySelectSearchable-option--selected" : ""
                }`}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="CountrySelectSearchable-flag" aria-hidden="true">
                  {opt.value ? getUnicodeFlagIcon(opt.value) : "🌐"}
                </span>
                <span className="CountrySelectSearchable-optionLabel">{opt.label}</span>
                {opt.value && (
                  <span className="CountrySelectSearchable-optionCode">
                    +{getCountryCallingCode(opt.value)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelectSearchable;
