import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Alert,
  Typography,
  Space,
  Card,
  Divider,
} from "antd";
import {
  SafetyOutlined,
  KeyOutlined,
  MailOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const TokenVerificationModal = ({ visible, onVerify, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleVerifyToken = async (values) => {
    setLoading(true);
    try {
      await onVerify(values.token);
      form.resetFields();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Token verification failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyOutlined />
          School Token Verification
        </Space>
      }
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <div>
        <Alert
          message="Token Required"
          description="The selected school requires token verification for class creation. Please enter the verification token provided by your school."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>
            <MailOutlined style={{ marginRight: 8 }} />
            What happens next?
          </Title>
          <Paragraph>
            <Text>1. Enter the verification token from your school</Text>
            <br />
            <Text>2. Your class request will be submitted for approval</Text>
            <br />
            <Text>3. The school will receive an email notification</Text>
            <br />
            <Text>4. Once approved, your class will be activated</Text>
          </Paragraph>
        </Card>

        <Form form={form} layout="vertical" onFinish={handleVerifyToken}>
          <Form.Item
            name="token"
            label="Verification Token"
            rules={[
              {
                required: true,
                message: "Please enter the verification token",
              },
              {
                min: 6,
                message: "Token must be at least 6 characters long",
              },
            ]}
          >
            <Input.Password
              placeholder="Enter the token provided by your school"
              prefix={<KeyOutlined />}
              size="large"
            />
          </Form.Item>

          <Alert
            message="Need Help?"
            description={
              <div>
                <Text>If you don't have a verification token:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Contact your school administrator</li>
                  <li>Check your email for the token</li>
                  <li>Verify you selected the correct school</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SafetyOutlined />}
              >
                Verify Token
              </Button>
            </Space>
          </div>
        </Form>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            This verification ensures that only authorized users can create
            classes associated with your school.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default TokenVerificationModal;
