import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Wraps a Font Awesome icon definition (e.g. faHouse) into a component with
 * the old lucide-react/antd call signature (<Icon size={16} className="..." />),
 * for code that stores or passes an icon component by reference (e.g.
 * `{ icon: Home }` rendered later as `<item.icon />`) instead of rendering
 * <FontAwesomeIcon icon={...} /> directly at the call site.
 *
 * Call this once per icon at module scope — not inside a render function —
 * so the resulting component has a stable identity across renders.
 */
export const asIconComponent = (faIcon) => {
  const Icon = ({ size, style, ...rest }) => (
    <FontAwesomeIcon
      icon={faIcon}
      style={size != null ? { fontSize: size, ...style } : style}
      {...rest}
    />
  );
  return Icon;
};
