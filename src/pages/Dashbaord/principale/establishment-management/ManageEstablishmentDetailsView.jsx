import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Space,
  Spin,
  Alert,
  Form,
  Input,
  Switch,
  Modal,
  Typography,
  Divider,
  Row,
  Col,
  Tabs,
  Table,
  Empty,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  BankOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import EstablishmentService from "../../../../services/EstablishmentService";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ManageEstablishmentDetailsView = ({
  establishmentId,
  onBack,
  onRefresh,
  onError,
  onSuccess,
  onUpdate,
  onDelete,
}) => {
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (establishmentId) {
      fetchEstablishmentDetails();
    }
  }, [establishmentId]);

  const fetchEstablishmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EstablishmentService.getEstablishmentById(
        establishmentId
      );
      setEstablishment(data);

      // Set form values
      form.setFieldsValue({
        nom: data.nom || "",
        localisation: data.localisation || "",
        pays: data.pays || "",
        email: data.email || "",
        telephone: data.telephone || "",
        optionEnvoiMailVersClasse: data.optionEnvoiMailVersClasse || false,
        optionTokenGeneral: data.optionTokenGeneral || false,
        codeUnique: data.codeUnique || false,
      });
    } catch (error) {
      console.error("Error fetching establishment details:", error);
      setError("Erreur lors du chargement des détails de l'établissement");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEstablishmentDetails();
    setRefreshing(false);
    setSuccessMessage("Données actualisées avec succès");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
    // Reset form to original values
    form.setFieldsValue({
      nom: establishment.nom || "",
      localisation: establishment.localisation || "",
      pays: establishment.pays || "",
      email: establishment.email || "",
      telephone: establishment.telephone || "",
      optionEnvoiMailVersClasse:
        establishment.optionEnvoiMailVersClasse || false,
      optionTokenGeneral: establishment.optionTokenGeneral || false,
      codeUnique: establishment.codeUnique || false,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setActionLoading("save");
      setError(null);

      const values = await form.validateFields();

      // Validate data
      const validation = EstablishmentService.validateEstablishment(values);
      if (!validation.isValid) {
        setError(validation.errors.join(", "));
        return;
      }

      await onUpdate(establishmentId, values);
      setEstablishment({ ...establishment, ...values });
      setEditing(false);
      setSuccessMessage("Établissement mis à jour avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving establishment:", error);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Supprimer l'établissement",
      icon: <ExclamationCircleOutlined />,
      content: `Êtes-vous sûr de vouloir supprimer l'établissement "${establishment?.nom}" ? Cette action est irréversible.`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setActionLoading("delete");
          await onDelete(establishmentId);
          onBack(); // Go back to list after successful deletion
        } catch (error) {
          console.error("Error deleting establishment:", error);
          setError("Erreur lors de la suppression");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const getStatusTag = (establishment) => {
    // Assuming we determine status based on data completeness
    const hasRequiredInfo =
      establishment.nom && establishment.localisation && establishment.pays;
    return (
      <Tag color={hasRequiredInfo ? "success" : "warning"}>
        {hasRequiredInfo ? "Actif" : "Incomplet"}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
        <span className="ml-3">
          Chargement des détails de l'établissement...
        </span>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="p-6">
        <Alert
          message="Impossible de charger les détails de l'établissement"
          description={error || "Une erreur est survenue lors du chargement"}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={handleRefresh}>
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
            <h2 className="text-2xl font-bold m-0">
              Gestion de l'établissement
            </h2>
            <p className="text-gray-500 m-0">{establishment.nom}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            type="default"
          >
            Actualiser
          </Button>

          {editing ? (
            <>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Sauvegarder
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={handleEdit}
                type="primary"
              >
                Modifier
              </Button>
              <Popconfirm
                title="Êtes-vous sûr de vouloir supprimer cet établissement ?"
                description="Cette action est irréversible."
                onConfirm={handleDelete}
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
            </>
          )}
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
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Establishment Information */}
      <Card title="Informations de l'établissement" className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Nom">
                {establishment.nom || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Localisation">
                <Space>
                  <EnvironmentOutlined style={{ color: "#52c41a" }} />
                  <Text>{establishment.localisation || "N/A"}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Pays">
                <Space>
                  <GlobalOutlined style={{ color: "#1890ff" }} />
                  <Text>{establishment.pays || "N/A"}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">
                {establishment.email ? (
                  <Space>
                    <MailOutlined style={{ color: "#faad14" }} />
                    <Text copyable>{establishment.email}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone">
                {establishment.telephone ? (
                  <Space>
                    <PhoneOutlined style={{ color: "#13c2c2" }} />
                    <Text copyable>{establishment.telephone}</Text>
                  </Space>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                {getStatusTag(establishment)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Configuration Options */}
      {editing ? (
        /* Edit Form */
        <Card title="Modifier les informations" className="mb-6">
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <BankOutlined />
                      <span>Informations Générales</span>
                    </Space>
                  }
                  size="small"
                >
                  <Form.Item
                    name="nom"
                    label="Nom de l'établissement"
                    rules={[
                      { required: true, message: "Le nom est requis" },
                      {
                        min: 2,
                        message: "Le nom doit contenir au moins 2 caractères",
                      },
                    ]}
                  >
                    <Input
                      prefix={<BankOutlined />}
                      placeholder="Nom de l'établissement"
                    />
                  </Form.Item>

                  <Form.Item
                    name="localisation"
                    label="Localisation"
                    rules={[
                      {
                        required: true,
                        message: "La localisation est requise",
                      },
                    ]}
                  >
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Adresse ou localisation"
                    />
                  </Form.Item>

                  <Form.Item
                    name="pays"
                    label="Pays"
                    rules={[{ required: true, message: "Le pays est requis" }]}
                  >
                    <Input prefix={<GlobalOutlined />} placeholder="Pays" />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <MailOutlined />
                      <span>Contact & Options</span>
                    </Space>
                  }
                  size="small"
                >
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: "email", message: "Format email invalide" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="contact@etablissement.com"
                    />
                  </Form.Item>

                  <Form.Item name="telephone" label="Téléphone">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </Form.Item>

                  <Divider orientation="left">
                    <Space>
                      <SettingOutlined />
                      <span>Options</span>
                    </Space>
                  </Divider>

                  <Form.Item
                    name="optionEnvoiMailVersClasse"
                    valuePropName="checked"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Envoi d'email vers les classes</span>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Form.Item name="optionTokenGeneral" valuePropName="checked">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Token général</span>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Form.Item name="codeUnique" valuePropName="checked">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Code unique</span>
                      <Switch />
                    </div>
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        </Card>
      ) : (
        /* Configuration Options Card */
        <Card title="Options de Configuration" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Envoi d'email vers les classes</Text>
                <Tag
                  color={
                    establishment.optionEnvoiMailVersClasse
                      ? "green"
                      : "default"
                  }
                >
                  {establishment.optionEnvoiMailVersClasse
                    ? "Activé"
                    : "Désactivé"}
                </Tag>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Token général</Text>
                <Tag
                  color={establishment.optionTokenGeneral ? "blue" : "default"}
                >
                  {establishment.optionTokenGeneral ? "Activé" : "Désactivé"}
                </Tag>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <Text>Code unique</Text>
                <Tag color={establishment.codeUnique ? "purple" : "default"}>
                  {establishment.codeUnique ? "Activé" : "Désactivé"}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Data Tabs */}
      {!editing && (
        <Card>
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  Classes (0)
                </span>
              }
              key="1"
            >
              <Empty
                description="Aucune classe dans cet établissement"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BookOutlined />
                  Professeurs (0)
                </span>
              }
              key="2"
            >
              <Empty
                description="Aucun professeur dans cet établissement"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined />
                  Informations Système
                </span>
              }
              key="3"
            >
              <Descriptions
                column={{ xs: 1, sm: 2, md: 3 }}
                bordered
                size="small"
              >
                <Descriptions.Item label="ID">
                  <Text code>{establishment.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date de création">
                  <Text>{establishment.dateCreation || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Dernière modification">
                  <Text>{establishment.dateModification || "N/A"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Code Unique" span={3}>
                  <Text code>{establishment.codeUnique || "Non défini"}</Text>
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default ManageEstablishmentDetailsView;
