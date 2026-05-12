import React, { useState } from "react";
import {
  Table, Button, Space, Tag, Tooltip, Popconfirm,
  Modal, List, Typography, Empty,
} from "antd";
import {
  EyeOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, QuestionCircleOutlined,
} from "@ant-design/icons";
import { questionReponseService } from "../../../../../../services/exerciseService";

const { Text } = Typography;

const QuestionDetailModal = ({ question, onClose, onEdit }) => {
  if (!question) return null;
  const type = question.typeQuestion;
  const sorted = question.choixReponses
    ? [...question.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage)
    : [];

  return (
    <Modal
      open={!!question}
      onCancel={onClose}
      title={
        <Space>
          <EyeOutlined />
          <span>Détail de la question</span>
          <Tag color="blue">{type}</Tag>
          <Tag color="green">{question.points || 0} pt{question.points > 1 ? "s" : ""}</Tag>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>Fermer</Button>,
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { onClose(); onEdit(question); }}>
          Modifier
        </Button>,
      ]}
      width={560}
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 bg-gray-50 rounded-lg">
          <Text type="secondary" className="text-xs block mb-1">Intitulé</Text>
          <Text strong>{question.intitule}</Text>
        </div>

        {(type === "QCM" || type === "VRAI_FAUX") && sorted.length > 0 && (
          <div>
            <Text strong className="text-sm block mb-2">Choix de réponses</Text>
            <List size="small" dataSource={sorted} renderItem={c => (
              <List.Item>
                <Space>
                  <Tag color={c.estCorrect ? "green" : "default"}>{c.estCorrect ? "✓ Correct" : "✕"}</Tag>
                  <Text>{c.texte}</Text>
                </Space>
              </List.Item>
            )} />
          </div>
        )}

        {type === "CLASSEMENT" && sorted.length > 0 && (
          <div>
            <Text strong className="text-sm block mb-2">Ordre correct</Text>
            <List size="small" dataSource={sorted} renderItem={(c, i) => (
              <List.Item><Space><Tag color="blue">{i + 1}</Tag><Text>{c.texte}</Text></Space></List.Item>
            )} />
          </div>
        )}

        {(type === "REPONSE_COURTE" || type === "REPONSE_LONGUE" || type === "DEVELOPPEMENT") && (
          <div>
            <Text strong className="text-sm block mb-2">Réponse attendue</Text>
            <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
              <Text>{question.reponse || <Text type="secondary">Non définie</Text>}</Text>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const QuestionsPanel = ({ exerciseId, questions, loading, onEditExercise, onRefresh }) => {
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (questionId) => {
    setDeletingId(questionId);
    try {
      await questionReponseService.deleteQuestion(questionId);
      onRefresh();
    } catch {
      // error handled by parent
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Intitulé",
      dataIndex: "intitule",
      key: "intitule",
      ellipsis: true,
      render: (text) => <Text strong className="text-sm">{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "typeQuestion",
      key: "typeQuestion",
      width: 140,
      responsive: ["md"],
      render: (type) => <Tag color="blue" className="text-xs">{type}</Tag>,
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      width: 80,
      render: (pts) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f" }}>
          {pts || 0} pt{pts > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      title: "Réponse / Choix",
      key: "reponseChoix",
      ellipsis: true,
      responsive: ["lg"],
      render: (_, record) => {
        const sorted = record.choixReponses
          ? [...record.choixReponses].sort((a, b) => a.ordreAffichage - b.ordreAffichage)
          : [];
        if (sorted.length > 0) {
          const correct = sorted.filter(c => c.estCorrect).map(c => c.texte).join(", ");
          return (
            <Tooltip title={`Bonne(s) réponse(s): ${correct}`}>
              <Space size={2} wrap>
                {sorted.slice(0, 3).map(c => (
                  <Tag key={c.id} color={c.estCorrect ? "green" : "default"} className="text-xs">{c.texte}</Tag>
                ))}
                {sorted.length > 3 && <Text type="secondary" className="text-xs">+{sorted.length - 3}</Text>}
              </Space>
            </Tooltip>
          );
        }
        if (record.reponse) return <Text code className="text-xs">{record.reponse}</Text>;
        return <Text type="secondary" className="text-xs">—</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Voir"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewingQuestion(record)} /></Tooltip>
          <Tooltip title="Modifier"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEditExercise(exerciseId)} /></Tooltip>
          <Popconfirm title="Supprimer cette question ?" onConfirm={() => handleDelete(record.id)} okText="Oui" cancelText="Non" okButtonProps={{ danger: true }}>
            <Tooltip title="Supprimer"><Button type="text" size="small" icon={<DeleteOutlined />} danger loading={deletingId === record.id} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={questions}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10, showTotal: (t) => `${t} question${t > 1 ? "s" : ""}` }}
        scroll={{ x: 600 }}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune question">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onEditExercise(exerciseId)}>
                Ajouter des questions
              </Button>
            </Empty>
          ),
        }}
      />
      <QuestionDetailModal
        question={viewingQuestion}
        onClose={() => setViewingQuestion(null)}
        onEdit={() => onEditExercise(exerciseId)}
      />
    </>
  );
};

export default QuestionsPanel;
