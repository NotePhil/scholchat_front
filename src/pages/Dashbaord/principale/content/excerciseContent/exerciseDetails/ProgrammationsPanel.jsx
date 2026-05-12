import React from "react";
import {
  Table, Button, Tag, Space, Tooltip, Popconfirm,
  Empty, Typography,
} from "antd";
import {
  DeleteOutlined, CalendarOutlined, TeamOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { statusTag, typeAssignationTag, fmtDateTime } from "./helpers";

const { Text } = Typography;

const ProgrammationsPanel = ({
  programmations,
  loading,
  deletingId,
  onDelete,
  onOpenProgramModal,
  onSelectProgrammation,
  selectedProgrammationId,
}) => {
  const columns = [
    {
      title: "Type",
      dataIndex: "typeAssignation",
      key: "typeAssignation",
      width: 130,
      render: (type) => typeAssignationTag(type),
    },
    {
      title: "Date prévue",
      dataIndex: "dateExoPrevue",
      key: "dateExoPrevue",
      render: (d) => (
        <span className="flex items-center gap-1 text-xs text-gray-600">
          <CalendarOutlined className="text-gray-400" /> {fmtDateTime(d)}
        </span>
      ),
    },
    {
      title: "Début",
      dataIndex: "dateDebutExoEffectif",
      key: "dateDebutExoEffectif",
      responsive: ["md"],
      render: (d) => <Text className="text-xs">{fmtDateTime(d)}</Text>,
    },
    {
      title: "Fin",
      dataIndex: "dateFinExoEffectif",
      key: "dateFinExoEffectif",
      responsive: ["md"],
      render: (d) => <Text className="text-xs">{fmtDateTime(d)}</Text>,
    },
    {
      title: "Statut",
      dataIndex: "etat",
      key: "etat",
      width: 120,
      render: (etat) => statusTag(etat),
    },
    {
      title: <span className="flex items-center gap-1"><TeamOutlined />Classes</span>,
      dataIndex: "classesDiffusees",
      key: "classesDiffusees",
      responsive: ["lg"],
      render: (classes) =>
        classes?.length > 0 ? (
          <Space size={4} wrap>
            {classes.map(c => (
              <Tag key={c.id} color="cyan" className="text-xs m-0">{c.nom}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" className="text-xs">Aucune</Text>
        ),
    },
    {
      title: "Corrections",
      key: "corrections",
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          type={selectedProgrammationId === record.id ? "primary" : "default"}
          onClick={() => onSelectProgrammation(record.id)}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          Voir résultats
        </Button>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Supprimer cette programmation ?"
          onConfirm={() => onDelete(record.id)}
          okText="Oui"
          cancelText="Non"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Supprimer">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              loading={deletingId === record.id}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={programmations}
      rowKey="id"
      loading={loading}
      size="middle"
      pagination={{ pageSize: 5, showTotal: (t) => `${t} programmation${t > 1 ? "s" : ""}` }}
      scroll={{ x: 800 }}
      rowClassName={(record) =>
        record.id === selectedProgrammationId ? "bg-blue-50" : ""
      }
      locale={{
        emptyText: (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune programmation">
            <Button type="primary" icon={<PlusOutlined />} onClick={onOpenProgramModal}>
              Programmer l'exercice
            </Button>
          </Empty>
        ),
      }}
    />
  );
};

export default ProgrammationsPanel;
