import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";

/**
 * Drop-in replacement for a native <select> whose open list has a limited
 * height and scrolls (a native list shows every option and can't be sized,
 * so long lists like the class levels ran off the screen).
 *
 * options: [{ value, label }]; onChange receives the selected value.
 */
const ScrollableSelect = ({
  value,
  onChange,
  options,
  placeholder = "",
  className = "",
  hasError = false,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Opening highlights the current value and scrolls it into view.
  useEffect(() => {
    if (!open) return;
    const i = options.findIndex((o) => o.value === value);
    setActive(i);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector(`[data-index="${Math.max(i, 0)}"]`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  const moveTo = (i) => {
    setActive(i);
    listRef.current
      ?.querySelector(`[data-index="${i}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveTo(Math.min(active + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveTo(Math.max(active - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between text-left bg-white ${hasError ? "border-red-500" : "border-gray-300"}`}
      >
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`ml-2 w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer ${i === active ? "bg-blue-50" : ""} ${isSelected ? "font-medium text-blue-700" : "text-gray-800"}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-blue-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ScrollableSelect;
