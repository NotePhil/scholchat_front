import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Alert,
  Divider,
  Typography,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import { SaveOutlined, CloseOutlined, BookOutlined } from "@ant-design/icons";
import { matiereService } from "../../../../../services/MatiereService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateExerciseForm = ({ onSubmit, onCancel, onError, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matieres, setMatieres] = useState([]);
  const [loadingMatieres, setLoadingMatieres] = useState(false);

  const niveauxOptions = [
    {
      value: "PRIMAIRE",
      label: "Primaire",
      children: ["CP", "CE1", "CE2", "CM1", "CM2"],
    },
    {
      value: "COLLEGE",
      label: "Collège",
      children: ["6ème", "5ème", "4ème", "3ème"],
    },
    { value: "LYCEE", label: "Lycée", children: ["2nde", "1ère", "Terminale"] },
    {
      value: "UNIVERSITE",
      label: "Université",
      children: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"],
    },
  ];

  const restrictionOptions = [
    { value: "PUBLIC", label: "Public - Tous les utilisateurs" },
    { value: "PRIVE", label: "Privé - Seulement mes classes" },
  ];

  useEffect(() => {
    fetchMatieres();
  }, []);

  const fetchMatieres = async () => {
    try {
      setLoadingMatieres(true);
      const data = await matiereService.getAllMatieres();
      console.log("Matières chargées:", data);
      setMatieres(data || []);
    } catch (error) {
      console.error("Error loading matieres:", error);
      message.warning("Impossible de charger les matières");
      setMatieres([]);
    } finally {
      setLoadingMatieres(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError("");

      const userId =
        sessionStorage.getItem("userId") ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("user_id") ||
        localStorage.getItem("user_id");

      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous reconnecter.");
      }

      const exerciseData = {
        nom: values.nom,
        description: values.description,
        niveau: values.niveau,
        restriction: values.restriction || "PRIVE",
        redacteurId: userId,
        etat: "BROUILLON",
        matiereIds: values.matiereIds || [],
      };

      console.log("Creating exercise with data:", exerciseData);
      await onSubmit(exerciseData);
      form.resetFields();
      onSuccess?.("Exercice créé avec succès");
    } catch (error) {
      console.error("Error creating exercise:", error);
      const errorMessage =
        error.message || "Erreur lors de la création de l'exercice";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError("");
    onCancel();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      <Card bordered={false} className="shadow-sm">
        <div className="mb-4 sm:mb-6">
          <Title level={3} className="flex items-center gap-2 mb-2">
            <BookOutlined className="text-blue-500" />
            <span className="text-lg sm:text-2xl">
              Créer un Nouvel Exercice
            </span>
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            Remplissez les informations de base pour créer un nouvel exercice
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            className="mb-4 sm:mb-6"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          scrollToFirstError
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-sm sm:text-base">
                    Informations de Base
                  </span>
                }
                size="small"
                className="h-full"
              >
                <Form.Item
                  name="nom"
                  label="Nom de l'exercice"
                  rules={[
                    { required: true, message: "Le nom est requis" },
                    {
                      min: 3,
                      message: "Le nom doit contenir au moins 3 caractères",
                    },
                    {
                      max: 200,
                      message: "Le nom ne peut pas dépasser 200 caractères",
                    },
                  ]}
                >
                  <Input
                    placeholder="Ex: Exercice de Mathématiques - Algèbre"
                    prefix={<BookOutlined />}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="niveau"
                  label="Niveau"
                  rules={[{ required: true, message: "Le niveau est requis" }]}
                >
                  <Select
                    placeholder="Sélectionnez le niveau"
                    showSearch
                    optionFilterProp="children"
                  >
                    {niveauxOptions.map((group) => (
                      <Select.OptGroup key={group.value} label={group.label}>
                        {group.children.map((niveau) => (
                          <Option key={niveau} value={niveau}>
                            {niveau}
                          </Option>
                        ))}
                      </Select.OptGroup>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="restriction"
                  label="Visibilité"
                  rules={[
                    { required: true, message: "La visibilité est requise" },
                  ]}
                  initialValue="PRIVE"
                >
                  <Select>
                    {restrictionOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="matiereIds"
                  label="Matières associées"
                  tooltip="Sélectionnez une ou plusieurs matières pour cet exercice"
                >
                  <Select
                    mode="multiple"
                    placeholder="Sélectionnez les matières"
                    loading={loadingMatieres}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    notFoundContent={
                      loadingMatieres ? (
                        <Spin size="small" />
                      ) : (
                        "Aucune matière disponible"
                      )
                    }
                  >
                    {matieres.map((matiere) => (
                      <Option key={matiere.id} value={matiere.id}>
                        {matiere.nom}{" "}
                        {matiere.description && `- ${matiere.description}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <span className="text-sm sm:text-base">Description</span>
                }
                size="small"
                className="h-full"
              >
                <Form.Item
                  name="description"
                  label="Description détaillée"
                  rules={[
                    { required: true, message: "La description est requise" },
                    {
                      min: 10,
                      message:
                        "La description doit contenir au moins 10 caractères",
                    },
                    {
                      max: 1000,
                      message:
                        "La description ne peut pas dépasser 1000 caractères",
                    },
                  ]}
                >
                  <TextArea
                    rows={12}
                    placeholder="Décrivez l'exercice en détail..."
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider className="my-4 sm:my-6" />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              size="large"
              onClick={handleCancel}
              disabled={loading}
              icon={<CloseOutlined />}
              block
              className="sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              block
              className="sm:w-auto"
            >
              Créer l'Exercice
            </Button>
          </div>
        </Form>
      </Card>

      <Card className="mt-4 sm:mt-6" size="small">
        <Title level={5} className="text-sm sm:text-base mb-3">
          Conseils pour créer un bon exercice
        </Title>
        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          <p>• Choisissez un nom clair et descriptif</p>
          <p>• Sélectionnez le niveau approprié pour vos étudiants</p>
          <p>
            • Rédigez une description complète avec les objectifs pédagogiques
          </p>
          <p>• Associez les matières pertinentes pour faciliter la recherche</p>
          <p>
            • Utilisez la visibilité "Privé" pour limiter l'accès à vos classes
          </p>
          <p>
            • Vous pourrez ajouter des questions après la création de l'exercice
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CreateExerciseForm;
