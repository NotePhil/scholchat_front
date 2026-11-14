import { useCallback, useEffect, useMemo, useState } from "react";
import { messageService } from "../services/MessageService";

const currentChildId = () => localStorage.getItem("selectedChildId") || null;
const isParentRole = () =>
  (localStorage.getItem("userRole") || "").toUpperCase().includes("PARENT");

/**
 * Parent messaging follows the child selected in the header, like activities and courses
 * (same rule as the mobile app's useChildClassScope): only that child's classes are offered,
 * and class conversations of the other children are hidden.
 * `classIds` is null when no scoping applies (not a parent, no child selected, or the server
 * does not say which child is in which class).
 */
export const useChildClassScope = () => {
  const isParent = isParentRole();
  const [childId, setChildId] = useState(currentChildId);
  const [classes, setClasses] = useState(null);

  useEffect(() => {
    const sync = () => setChildId(currentChildId());
    window.addEventListener("childChanged", sync);
    return () => window.removeEventListener("childChanged", sync);
  }, []);

  useEffect(() => {
    if (!isParent) return undefined;
    let cancelled = false;
    messageService
      .getContactClasses()
      .then((list) => !cancelled && setClasses(Array.isArray(list) ? list : []))
      .catch(() => !cancelled && setClasses(null));
    return () => {
      cancelled = true;
    };
  }, [isParent, childId]);

  const classIds = useMemo(() => {
    if (!isParent || !childId || !classes) return null;
    if (!classes.some((c) => Array.isArray(c.eleveIds) && c.eleveIds.length > 0))
      return null;
    return new Set(
      classes
        .filter((c) => (c.eleveIds || []).includes(childId))
        .map((c) => String(c.id)),
    );
  }, [isParent, childId, classes]);

  /** Keeps the classes of the selected child. */
  const scopeClasses = useCallback(
    (list) =>
      classIds ? list.filter((c) => classIds.has(String(c.id))) : list,
    [classIds],
  );

  /** Individual conversations always stay; class ones only when they concern the selected child's classes. */
  const inScope = useCallback(
    (c) => {
      if (!classIds) return true;
      const ids =
        c.classeIds && c.classeIds.length > 0
          ? c.classeIds
          : c.classeId
            ? [c.classeId]
            : [];
      return ids.length === 0 || ids.some((id) => classIds.has(String(id)));
    },
    [classIds],
  );

  return { classIds, scopeClasses, inScope };
};
