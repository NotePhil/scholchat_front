import React from "react";
import {
  Modal, Form, DatePicker, Select, Button, Alert,
  Divider, Switch, Typography, Space,
} from "antd";
import {
  CalendarOutlined, TeamOutlined, SendOutlined,
  BookOutlined, FileTextOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

const ProgramModal = ({
  open,
  onCancel,
  onFinish,
  loading,
  classes,
  classesLoading,
  form,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#1677ff" }} />
          <span className="font-semibold">Programmer l'exercice</span>
        </Space>
      }
      footer={null}
      width={620}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="pt-2">

        {/* Type d'assignation */}
        <Form.Item
          name="typeAssignation"
          label="Type d'assignation"
          initialValue="EXERCICE"
          rules={[{ required: true }]}
        >
          <Select size="large">
            <Option value="EXERCICE">
              <Space>
                <BookOutlined style={{ color: "#1677ff" }} />
                <div>
                  <div className="font-medium">Exercice libre</div>
                  <div className="text-xs text-gray-400">Auto-corrigé, résultat immédiat</div>
                </div>
              </Space>
            </Option>
            <Option value="DEVOIR">
              <Space>
                <FileTextOutlined style={{ color: "#531dab" }} />
                <div>
                  <div className="font-medium">Devoir</div>
                  <div className="text-xs text-gray-400">Soumis, correction manuelle du prof</div>
                </div>
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Divider className="my-3" />

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Form.Item
            name="dateExoPrevue"
            label="Date prévue"
            rules={[{ required: true, message: "Requis" }]}
          >
            <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" placeholder="Date prévue" />
          </Form.Item>
          <Form.Item
            name="dateDebutExoEffectif"
            label="Début effectif"
            rules={[{ required: true, message: "Requis" }]}
          >
            <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" placeholder="Début" />
          </Form.Item>
          <Form.Item
            name="dateFinExoEffectif"
            label="Fin effective"
            rules={[
              { required: true, message: "Requis" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue("dateDebutExoEffectif");
                  if (!value || !start || value.isAfter(start)) return Promise.resolve();
                  return Promise.reject(new Error("Doit être après le début"));
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY HH:mm" placeholder="Fin" />
          </Form.Item>
        </div>

        {/* Classes */}
        <Form.Item
          name="classeIds"
          label={<Space><TeamOutlined />Classes concernées</Space>}
          rules={[{ required: true, message: "Sélectionnez au moins une classe" }]}
          extra={classesLoading ? "Chargement..." : `${classes.length} classe(s) disponible(s)`}
        >
          <Select
            mode="multiple"
            placeholder="Sélectionnez les classes"
            loading={classesLoading}
            optionFilterProp="children"
            size="large"
          >
            {classes.map(c => (
              <Option key={c.id} value={c.id}>
                {c.nom}{c.niveau ? ` — ${c.niveau}` : ""}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Diffuse immediately toggle */}
        <Form.Item name="diffuseImmediately" valuePropName="checked" initialValue={true}>
          <div className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "#f0f5ff", border: "1px solid #adc6ff" }}>
            <div>
              <Text strong className="text-sm">Diffuser immédiatement</Text>
              <br />
              <Text type="secondary" className="text-xs">
                L'exercice sera visible par les élèves dès maintenant
              </Text>
            </div>
            <Switch defaultChecked />
          </div>
        </Form.Item>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onCancel}>Annuler</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
          >
            Programmer et diffuser
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProgramModal;
