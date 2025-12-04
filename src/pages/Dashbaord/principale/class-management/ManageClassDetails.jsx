import React from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Tag,
  Popconfirm,
  Space,
  Card,
  Row,
  Col,
  Descriptions,
  Alert,
  Spin,
  Empty,
  Table,
  Divider,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  HistoryOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  BookOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const ManageClassDetails = ({
  classData,
  loading,
  error,
  successMessage,
  refreshing,
  professors,
  actionLoading,
  history,
  rejectReason,
  selectedPublicationRight,
  form,

  // Handlers
  onBack,
  onRefresh,
  onApprove,
  onReject,
  onDelete,
  onFetchActivationHistory,
  onModeratorAssign,
  onModeratorRemove,
  onPublicationRightsUpdate,

  // Modal states
  historyModalVisible,
  setHistoryModalVisible,
  moderatorModalVisible,
  setModeratorModalVisible,
  rejectModalVisible,
  setRejectModalVisible,
  publicationRightsModalVisible,
  setPublicationRightsModalVisible,
  setRejectReason,
  setSelectedPublicationRight,
}) => {
  const getStatusColor = (etat) => {
    switch (etat) {
      case "ACTIF":
        return "success";
      case "EN_ATTENTE_APPROBATION":
        return "warning";
      case "INACTIF":
        return "error";
      default:
        return "default";
    }
  };

  const getPublicationRightLabel = (droit) => {
    switch (droit) {
      case "PROFESSEURS_SEULEMENT":
        return "Professeurs seulement";
      case "TOUS":
        return "Tous";
      case "MODERATEUR_SEULEMENT":
        return "Modérateur seulement";
      case "PARENTS_ET_MODERATEUR":
        return "Parents et Modérateur";
      default:
        return "Non défini";
    }
  };

  const historyColumns = [
    {
      title: "Date",
      dataIndex: "dateActivation",
      key: "dateActivation",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Professeur",
      dataIndex: "professeur",
      key: "professeur",
      render: (prof) => (prof ? `${prof.nom} ${prof.prenom}` : "N/A"),
    },
    {
      title: "État",
      dataIndex: "isActive",
      key: "isActive",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Activé" : "Désactivé"}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
        <span className="ml-3">Chargement des détails de la classe...</span>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <Alert
          message="Impossible de charger les détails de la classe"
          description={error || "Une erreur est survenue lors du chargement"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={onRefresh}>
                Réessayer
              </Button>
              <Button size="small" type="primary" onClick={onBack}>
                Retour à la liste
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" />
          <div>
            <h2 className="text-2xl font-bold m-0">Gestion de la classe</h2>
            <p className="text-gray-500 m-0">{classData.nom}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={refreshing}
            type="default"
          >
            Actualiser
          </Button>

          {classData.etat === "EN_ATTENTE_APPROBATION" && classData.etablissement && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => onApprove(classData.id, classData.etablissement.id)}
                loading={actionLoading === "approve"}
              >
                Valider
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => onReject(classData.id, classData.etablissement.id)}
                loading={actionLoading === "reject"}
              >
                Rejeter
              </Button>
            </>
          )}

          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cette classe ?"
            description="Cette action est irréversible."
            onConfirm={onDelete}
            okText="Oui"
            cancelText="Non"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={actionLoading === "delete"}
            >
              Supprimer
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* Error Message */}
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* Action Buttons */}
      <div className="mb-6">
        <Space wrap>
          <Button
            icon={<HistoryOutlined />}
            onClick={onFetchActivationHistory}
            loading={actionLoading === "history"}
          >
            Historique d'activation
          </Button>

          <Button
            icon={<FileTextOutlined />}
            onClick={() => setPublicationRightsModalVisible(true)}
          >
            Droits de publication
          </Button>

          <Button
            type="dashed"
            icon={<UserAddOutlined />}
            onClick={() => setModeratorModalVisible(true)}
            disabled={!professors.length}
          >
            Assigner un modérateur
          </Button>

          {classData.moderator && (
            <Button
              danger
              icon={<UserDeleteOutlined />}
              onClick={onModeratorRemove}
              loading={actionLoading === "removeModerator"}
            >
              Retirer le modérateur
            </Button>
          )}
        </Space>
      </div>

      {/* Class Information */}
      <Card title="Informations de la classe" className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nom">{classData.nom}</Descriptions.Item>
              <Descriptions.Item label="Niveau">
                {classData.niveau}
              </Descriptions.Item>
              <Descriptions.Item label="État">
                <Tag color={getStatusColor(classData.etat)}>
                  {classData.etat}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Date de création">
                {classData.dateCreation
                  ? new Date(classData.dateCreation).toLocaleString()
                  : "Non définie"}
              </Descriptions.Item>
              <Descriptions.Item label="Droits de publication">
                {getPublicationRightLabel(classData.droitPublication)}
              </Descriptions.Item>
              <Descriptions.Item label="Modérateur">
                {classData.moderator
                  ? `${classData.moderator.nom} ${classData.moderator.prenom}`
                  : "Non assigné"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Data Tabs */}
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Élèves ({classData.eleves?.length || 0})
              </span>
            }
            key="1"
          >
            {!classData.eleves || classData.eleves.length === 0 ? (
              <Empty
                description="Aucun élève dans cette classe"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={[
                  { title: "Nom", dataIndex: "nom", key: "nom" },
                  { title: "Prénom", dataIndex: "prenom", key: "prenom" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  { title: "Niveau", dataIndex: "niveau", key: "niveau" },
                ]}
                dataSource={classData.eleves}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                Parents ({classData.parents?.length || 0})
              </span>
            }
            key="2"
          >
            {!classData.parents || classData.parents.length === 0 ? (
              <Empty
                description="Aucun parent dans cette classe"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={[
                  { title: "Nom", dataIndex: "nom", key: "nom" },
                  { title: "Prénom", dataIndex: "prenom", key: "prenom" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  {
                    title: "Téléphone",
                    dataIndex: "telephone",
                    key: "telephone",
                  },
                ]}
                dataSource={classData.parents}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}

      {/* Activation History Modal */}
      <Modal
        title="Historique d'activation"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        {history.length === 0 ? (
          <Empty description="Aucun historique disponible" />
        ) : (
          <Table
            columns={historyColumns}
            dataSource={history}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Modal>

      {/* Assign Moderator Modal */}
      <Modal
        title="Assigner un modérateur"
        open={moderatorModalVisible}
        onCancel={() => {
          setModeratorModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading === "moderator"}
      >
        <Form form={form} layout="vertical" onFinish={onModeratorAssign}>
          <Form.Item
            name="moderatorId"
            label="Sélectionner un professeur"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un professeur!",
              },
            ]}
          >
            <Select placeholder="Choisir un professeur" showSearch>
              {professors.map((prof) => (
                <Option key={prof.id} value={prof.id}>
                  {prof.nom} {prof.prenom} - {prof.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Class Modal */}
      <Modal
        title="Rejeter la classe"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason("");
        }}
        onOk={onReject}
        okText="Rejeter"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading === "reject"}
      >
        <p>Veuillez fournir une raison pour le rejet de cette classe :</p>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Entrez la raison du rejet..."
        />
      </Modal>

      {/* Publication Rights Modal */}
      <Modal
        title="Modifier les droits de publication"
        open={publicationRightsModalVisible}
        onCancel={() => setPublicationRightsModalVisible(false)}
        onOk={onPublicationRightsUpdate}
        okText="Mettre à jour"
        confirmLoading={actionLoading === "publicationRights"}
      >
        <p className="mb-4">
          Sélectionnez qui peut publier du contenu dans cette classe :
        </p>
        <Select
          style={{ width: "100%" }}
          value={selectedPublicationRight}
          onChange={(value) => setSelectedPublicationRight(value)}
          placeholder="Sélectionner les droits de publication"
        >
          <Option value="PROFESSEURS_SEULEMENT">Professeurs seulement</Option>
          <Option value="TOUS">Tous</Option>
          <Option value="MODERATEUR_SEULEMENT">Modérateur seulement</Option>
          <Option value="PARENTS_ET_MODERATEUR">Parents et modérateur</Option>
        </Select>
      </Modal>
    </div>
  );
};

export default ManageClassDetails;
