import React, { useEffect, useRef, useState } from "react";
import { Form, Select } from "antd";
import {
  GENERAL_COURSE_KEY,
  loadClassCourseOptions,
} from "../../../../../utils/scolarite";
import NoCourseNotice from "./NoCourseNotice";

/**
 * "Cours" part of an exercise programming form: ONE required select per
 * selected class, listing the courses programmed in that class (labelled
 * "Cours — Classe"). There is no exercise / homework without a course: a class
 * with no programmed course shows a notice with a shortcut to course
 * programming, and the backend refuses a missing course (400 COURS_REQUIS).
 *
 * Form values live under `name` (default "coursParClasse") as
 * { [classeId]: coursId }; convert them with toCoursParClasse() before sending
 * (backend field `coursParClasse`). Classes mapped to different courses
 * produce one programmation per course.
 */
export const toCoursId = (value) => (!value || value === GENERAL_COURSE_KEY ? null : value);

/** Message to show for a failed programming request (maps 400 COURS_REQUIS). */
export const programmingErrorMessage = (e, fallback = "Erreur lors de la programmation") => {
  if (e?.code === "COURS_REQUIS") {
    return e.message || "Choisissez le cours auquel rattacher cet exercice pour chaque classe.";
  }
  return e?.message || fallback;
};

/** {classeId: coursId} for the selected classes only (stale entries of unselected classes dropped). */
export const toCoursParClasse = (values, classeIds = []) => {
  const out = {};
  (classeIds || []).filter(Boolean).forEach((id) => {
    out[id] = toCoursId(values ? values[id] : null);
  });
  return out;
};

/** Number of programmations created by a POST /exercises-programmer[/programmer-et-diffuser] response. */
export const countProgrammations = (response) =>
  response?.nombreProgrammations || response?.programmations?.length || 1;

const CoursSelectField = ({
  form,
  classes = [],
  classesField = "classeIds",
  name = "coursParClasse",
  size = "large",
  label,
}) => {
  const watched = Form.useWatch(classesField, form);
  const classIds = (Array.isArray(watched) ? watched : watched ? [watched] : []).filter(Boolean);
  const key = classIds.join(",");
  // classeId -> [{coursId, titre, matiere}] | undefined (loading)
  const [optionsByClass, setOptionsByClass] = useState({});
  const loadedRef = useRef({});

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    key
      .split(",")
      .filter(Boolean)
      .forEach((classeId) => {
        if (loadedRef.current[classeId]) return;
        loadedRef.current[classeId] = true;
        loadClassCourseOptions(classeId)
          .catch(() => [])
          .then((list) => {
            if (!mountedRef.current) return;
            setOptionsByClass((prev) => ({ ...prev, [classeId]: list || [] }));
            const current = form.getFieldValue([name, classeId]);
            if (current && !(list || []).some((c) => String(c.coursId) === String(current))) {
              form.setFieldValue([name, classeId], undefined);
            }
          });
      });
  }, [key, form, name]);

  const className = (id) => {
    const c = classes.find((x) => String(x.id) === String(id));
    return c?.nom || "Classe";
  };

  const header = label || <span className="text-sm font-medium text-gray-700">Cours</span>;

  if (!classIds.length) {
    return (
      <Form.Item label={header} extra="Choisissez d'abord la ou les classes.">
        <Select size={size} disabled placeholder="Choisissez d'abord la classe" />
      </Form.Item>
    );
  }

  return (
    <Form.Item
      label={header}
      extra={
        classIds.length > 1
          ? "Un cours par classe. Des cours différents créent une programmation par cours."
          : undefined
      }
      style={{ marginBottom: 12 }}
    >
      <div className={classIds.length > 1 ? "rounded-lg border border-slate-200 p-3 pb-0" : ""}>
        {classIds.map((classeId) => {
          const nomClasse = className(classeId);
          const list = optionsByClass[classeId];
          const loading = list === undefined;
          const empty = !loading && list.length === 0;
          return (
            <Form.Item
              key={classeId}
              name={[name, classeId]}
              label={classIds.length > 1 ? <span className="text-xs text-slate-600">{nomClasse}</span> : undefined}
              rules={[
                {
                  required: true,
                  message: empty
                    ? `Aucun cours programmé dans ${nomClasse} — programmez d'abord un cours`
                    : `Choisissez le cours auquel rattacher cet exercice pour ${nomClasse}`,
                },
              ]}
              extra={
                loading ? (
                  "Chargement des cours programmés…"
                ) : empty ? (
                  <NoCourseNotice classeId={classeId} classeNom={classIds.length > 1 ? nomClasse : null} />
                ) : undefined
              }
              style={{ marginBottom: classIds.length > 1 ? 12 : 0 }}
            >
              <Select
                size={size}
                placeholder={`Cours — ${nomClasse}`}
                loading={loading}
                disabled={empty}
                showSearch
                optionFilterProp="label"
                options={(list || []).map((c) => ({
                  value: c.coursId,
                  label: `${c.titre}${c.matiere ? ` (${c.matiere})` : ""} — ${nomClasse}`,
                }))}
              />
            </Form.Item>
          );
        })}
      </div>
    </Form.Item>
  );
};

export default CoursSelectField;
