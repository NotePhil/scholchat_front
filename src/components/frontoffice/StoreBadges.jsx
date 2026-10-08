import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple, faGooglePlay } from "@fortawesome/free-brands-svg-icons";

// Store links are not published yet: '#' placeholders (to be replaced by the real URLs).
export const APP_STORE_URL = "#";
export const GOOGLE_PLAY_URL = "#";

const Badge = ({ href, icon, small, big, compact }) => (
  <a
    href={href}
    onClick={(e) => href === "#" && e.preventDefault()}
    className={`inline-flex items-center gap-2.5 rounded-xl bg-slate-900 text-white hover:bg-black transition-colors border border-slate-700 ${
      compact ? "px-3 py-1.5" : "px-4 py-2"
    }`}
    aria-label={`${small} ${big}`}
  >
    <FontAwesomeIcon icon={icon} className={compact ? "text-lg" : "text-2xl"} />
    <span className="flex flex-col leading-none text-left">
      <span className="text-[9px] opacity-80">{small}</span>
      <span className={`${compact ? "text-xs" : "text-sm"} font-semibold`}>{big}</span>
    </span>
  </a>
);

export const StoreBadges = ({ compact = false, className = "" }) => (
  <div className={`flex flex-wrap gap-3 ${className}`}>
    <Badge href={APP_STORE_URL} icon={faApple} small="Disponible sur" big="App Store" compact={compact} />
    <Badge href={GOOGLE_PLAY_URL} icon={faGooglePlay} small="Disponible sur" big="Google Play" compact={compact} />
  </div>
);

export default StoreBadges;
