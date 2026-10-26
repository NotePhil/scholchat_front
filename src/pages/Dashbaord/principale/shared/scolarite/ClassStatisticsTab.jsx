import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Collapse, Empty, Input, Spin, Table, Tag } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBookOpen,
  faCheckDouble,
  faClipboardCheck,
  faMagnifyingGlass,
  faPercent,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOpenTab } from "../../../../../hooks/useOpenTab";
import { average, fmtNote20, fmtPct, loadClassStatistics, round1 } from "../../../../../utils/scolarite";

const INK = "#334155";
const MUTED = "#94a3b8";
const GRID = "#e2e8f0";
const SERIES = "#4f46e5"; // single-series charts: one hue

const SummaryCard = ({ icon, label, value, hint }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
      <FontAwesomeIcon icon={icon} className="text-indigo-500" style={{ fontSize: 13 }} />
      {label}
    </div>
    <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
    {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800 mb-0.5">{label}</p>
      <p className="text-slate-600">{v === null || v === undefined ? "—" : `${round1(v)}${unit}`}</p>
    </div>
  );
};

const SimpleBarChart = ({ title, data, unit, max }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <h4 className="text-sm font-semibold text-slate-800 mb-3">{title}</h4>
    {data.every((d) => d.value === null) ? (
      <p className="text-sm text-slate-500 py-8 text-center">Pas encore de données.</p>
    ) : (
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: MUTED }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval={0}
              tickFormatter={(v) => (String(v).length > 14 ? `${String(v).slice(0, 13)}…` : v)}
            />
            <YAxis domain={[0, max]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "rgba(79,70,229,0.06)" }} content={<ChartTooltip unit={unit} />} />
            <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

/**
 * Professor class detail → "Statistiques": per course (progression moyenne,
 * per exercise rendus/attendus, à corriger, moyenne/min/max) and per learner
 * (progression, devoirs rendus, moyenne, en retard), sortable.
 * eleves: class learners [{id, nom, prenom}] (used by the client-side fallback).
 */
const ClassStatisticsTab = ({ classId, eleves = [] }) => {
  const openTab = useOpenTab();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const elevesKey = eleves.map((e) => e.id).join(",");
  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      setStats(await loadClassStatistics(classId, eleves));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [classId, elevesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    if (!stats) return null;
    const exos = stats.cours.flatMap((c) => c.exercices);
    const rendus = exos.reduce((n, e) => n + (e.rendus || 0), 0);
    const attendus = exos.reduce((n, e) => n + (e.attendus || 0), 0);
    return {
      progression: average(stats.cours.map((c) => c.progressionMoyenne)),
      tauxRendu: attendus ? (rendus / attendus) * 100 : null,
      aCorriger: exos.reduce((n, e) => n + (e.enAttenteCorrection || 0), 0),
      moyenne: average(stats.eleves.map((s) => s.moyenne)) ?? average(exos.map((e) => e.moyenne)),
      nbExos: exos.length,
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin />
      </div>
    );
  }
  if (!stats) {
    return <Empty description="Statistiques indisponibles pour le moment" />;
  }

  const progressionData = stats.cours.map((c) => ({ name: c.titre, value: c.progressionMoyenne }));
  const moyenneData = stats.cours.map((c) => ({ name: c.titre, value: average(c.exercices.map((e) => e.moyenne)) }));

  const exerciseColumns = [
    { title: "Exercice", dataIndex: "titre", key: "titre", ellipsis: true },
    {
      title: "Rendus",
      key: "rendus",
      width: 160,
      sorter: (a, b) => a.rendus - b.rendus,
      render: (_, e) => {
        const pct = e.attendus ? Math.min(100, (e.rendus / e.attendus) * 100) : 0;
        return (
          <div>
            <span className="text-xs text-slate-700">
              {e.rendus}
              {e.attendus ? `/${e.attendus}` : ""}
            </span>
            {e.attendus ? (
              <div className="h-1.5 rounded-full bg-slate-100 mt-1">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: SERIES }} />
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "À corriger",
      dataIndex: "enAttenteCorrection",
      key: "acorriger",
      width: 100,
      sorter: (a, b) => a.enAttenteCorrection - b.enAttenteCorrection,
      render: (v) => (v ? <Tag color="orange">{v}</Tag> : <span className="text-slate-400">0</span>),
    },
    { title: "Moyenne", dataIndex: "moyenne", key: "moy", width: 95, sorter: (a, b) => (a.moyenne ?? -1) - (b.moyenne ?? -1), render: fmtNote20 },
    { title: "Min", dataIndex: "min", key: "min", width: 80, responsive: ["md"], render: fmtNote20 },
    { title: "Max", dataIndex: "max", key: "max", width: 80, responsive: ["md"], render: fmtNote20 },
    {
      title: "",
      key: "act",
      width: 120,
      render: (_, e) => (
        <Button
          size="small"
          icon={<FontAwesomeIcon icon={faCheckDouble} />}
          onClick={() => openTab("corrections-exercise", { exerciseProgrammerId: e.exerciseProgrammerId })}
        >
          Corrections
        </Button>
      ),
    },
  ];

  const q = search.trim().toLowerCase();
  const studentRows = stats.eleves
    .map((s) => ({ ...s, key: s.eleveId, fullName: `${s.prenom} ${s.nom}`.trim() || "Élève" }))
    .filter((s) => !q || s.fullName.toLowerCase().includes(q));
  const studentColumns = [
    {
      title: "Élève",
      dataIndex: "fullName",
      key: "name",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      defaultSortOrder: "ascend",
    },
    {
      title: "Progression",
      dataIndex: "progressionMoyenne",
      key: "prog",
      width: 150,
      sorter: (a, b) => (a.progressionMoyenne ?? -1) - (b.progressionMoyenne ?? -1),
      render: (v) =>
        v === null ? (
          "—"
        ) : (
          <div>
            <span className="text-xs text-slate-700">{fmtPct(v)}</span>
            <div className="h-1.5 rounded-full bg-slate-100 mt-1">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, v)}%`, background: SERIES }} />
            </div>
          </div>
        ),
    },
    {
      title: "Devoirs rendus",
      key: "rendus",
      width: 130,
      sorter: (a, b) => a.devoirsRendus / (a.devoirsTotal || 1) - b.devoirsRendus / (b.devoirsTotal || 1),
      render: (_, s) => `${s.devoirsRendus}/${s.devoirsTotal}`,
    },
    {
      title: "Moyenne",
      dataIndex: "moyenne",
      key: "moy",
      width: 100,
      sorter: (a, b) => (a.moyenne ?? -1) - (b.moyenne ?? -1),
      render: fmtNote20,
    },
    {
      title: "En retard",
      dataIndex: "enRetard",
      key: "late",
      width: 100,
      sorter: (a, b) => a.enRetard - b.enRetard,
      render: (v) => (v ? <Tag color="red">{v}</Tag> : <span className="text-slate-400">0</span>),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Statistiques de la classe</h3>
          <p className="text-xs text-slate-500">
            {summary.nbExos} exercice{summary.nbExos > 1 ? "s" : ""} programmé{summary.nbExos > 1 ? "s" : ""}
            {stats.fromApi ? "" : " · calcul approximatif (progression des cours indisponible)"}
          </p>
        </div>
        <Button size="small" icon={<FontAwesomeIcon icon={faArrowsRotate} />} onClick={load}>
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={faUserGroup} label="Effectif" value={stats.effectif ?? "—"} hint="élèves" />
        <SummaryCard icon={faBookOpen} label="Progression moyenne" value={fmtPct(summary.progression)} hint="chapitres lus" />
        <SummaryCard icon={faPercent} label="Taux de rendu" value={fmtPct(summary.tauxRendu)} hint={`Moyenne ${fmtNote20(summary.moyenne)}`} />
        <SummaryCard icon={faClipboardCheck} label="À corriger" value={summary.aCorriger} hint="copies en attente" />
      </div>

      {stats.cours.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {stats.cours.length > 0 && (
            <SimpleBarChart title="Progression moyenne par cours (%)" data={progressionData} unit="%" max={100} />
          )}
          <SimpleBarChart title="Moyenne des exercices par cours (/20)" data={moyenneData} unit="/20" max={20} />
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-2">Par cours</h4>
        {stats.cours.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun cours programmé" />
        ) : (
          <Collapse
            defaultActiveKey={stats.cours.slice(0, 1).map((c) => String(c.coursId))}
            items={stats.cours.map((c) => {
              const aCorriger = c.exercices.reduce((n, e) => n + (e.enAttenteCorrection || 0), 0);
              return {
                key: String(c.coursId),
                label: (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-800">{c.titre}</span>
                    <span className="text-xs text-slate-500">
                      Progression <strong style={{ color: INK }}>{fmtPct(c.progressionMoyenne)}</strong>
                    </span>
                    <span className="text-xs text-slate-500">
                      {c.exercices.length} exercice{c.exercices.length > 1 ? "s" : ""}
                    </span>
                    {aCorriger > 0 && <Tag color="orange">{aCorriger} à corriger</Tag>}
                  </div>
                ),
                children: (
                  <Table
                    size="small"
                    rowKey="exerciseProgrammerId"
                    columns={exerciseColumns}
                    dataSource={c.exercices}
                    pagination={c.exercices.length > 8 ? { pageSize: 8 } : false}
                    scroll={{ x: 640 }}
                    locale={{ emptyText: "Aucun exercice lié à ce cours" }}
                  />
                ),
              };
            })}
          />
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-800">Par élève</h4>
          <Input
            allowClear
            size="small"
            placeholder="Rechercher un élève"
            prefix={<FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
        </div>
        <Table
          size="small"
          columns={studentColumns}
          dataSource={studentRows}
          pagination={studentRows.length > 15 ? { pageSize: 15 } : false}
          scroll={{ x: 560 }}
          locale={{ emptyText: "Aucun élève dans cette classe" }}
        />
      </div>
    </div>
  );
};

export default ClassStatisticsTab;
