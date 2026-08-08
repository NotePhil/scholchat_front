import React from "react";
import { Form, Input, Select, Tag } from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LockOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { statusTag, restrictionTag, fmtDate } from "./helpers";

const { TextArea } = Input;
const { Option } = Select;

const NIVEAUX = ["6ème","5ème","4ème","3ème","2nde","1ère","Terminale","Licence 1","Licence 2","Licence 3","Master 1","Master 2","CP","CE1","CE2","CM1","CM2"];

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-36 flex-shrink-0 pt-0.5">{label}</span>
    <div className="flex-1 text-sm text-gray-800">{children}</div>
  </div>
);

const ExerciseInfoPanel = ({ exercise, editing, form }) => {
  if (editing) {
    return (
      <Form form={form} layout="vertical" className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Form.Item name="nom" label="Nom de l'exercice" rules={[{ required: true }]}>
            <Input prefix={<BookOutlined />} />
          </Form.Item>
          <Form.Item name="niveau" label="Niveau" rules={[{ required: true }]}>
            <Select>
              {NIVEAUX.map(n => <Option key={n} value={n}>{n}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="restriction" label="Visibilité" rules={[{ required: true }]}>
            <Select>
              <Option value="PUBLIC"><GlobalOutlined /> Public</Option>
              <Option value="PRIVE"><LockOutlined /> Privé</Option>
            </Select>
          </Form.Item>
          <Form.Item name="etat" label="Statut">
            <Select>
              <Option value="BROUILLON">Brouillon</Option>
              <Option value="ACTIF">Actif</Option>
              <Option value="INACTIF">Inactif</Option>
            </Select>
          </Form.Item>
        </div>
        <Form.Item name="description" label="Description" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    );
  }

  return (
    <div>
      <InfoRow label="Nom">{exercise.nom || "—"}</InfoRow>
      <InfoRow label="Niveau">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "#e0f7fa", color: "#00838f", border: "1px solid #b2ebf2" }}>
          {exercise.niveau || "—"}
        </span>
      </InfoRow>
      <InfoRow label="Statut">{statusTag(exercise.etat)}</InfoRow>
      <InfoRow label="Visibilité">{restrictionTag(exercise.restriction)}</InfoRow>
      <InfoRow label="Créé le">
        <span className="flex items-center gap-1 text-gray-500">
          <CalendarOutlined className="text-xs" /> {fmtDate(exercise.dateCreation)}
        </span>
      </InfoRow>
      {exercise.matieres?.length > 0 && (
        <InfoRow label="Matières">
          <div className="flex flex-wrap gap-1">
            {exercise.matieres.map(m => (
              <Tag key={m.id} color="purple" className="text-xs m-0">{m.nom}</Tag>
            ))}
          </div>
        </InfoRow>
      )}
      {exercise.coursLies?.length > 0 && (
        <InfoRow label="Cours liés">
          <div className="flex flex-wrap gap-1">
            {exercise.coursLies.map(c => (
              <Tag key={c.id} color="cyan" className="text-xs m-0">{c.nom || c.titre}</Tag>
            ))}
          </div>
        </InfoRow>
      )}
      <InfoRow label="Description">
        <span className="text-gray-600 leading-relaxed">
          <FileTextOutlined className="mr-1 text-gray-400" />
          {exercise.description || "Aucune description"}
        </span>
      </InfoRow>
    </div>
  );
};

export default ExerciseInfoPanel;
