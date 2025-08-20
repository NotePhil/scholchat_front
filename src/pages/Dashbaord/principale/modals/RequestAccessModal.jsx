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
  Select,
  Divider,
  Row,
  Col,
} from "antd";
import {
  UserAddOutlined,
  MailOutlined,
  InfoCircleOutlined,
  SendOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const RequestAccessModal = ({ visible, classData, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async (values) => {
    setLoading(true);
    try {
      // Simulate API call to submit access request
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real application, you would send the request to your backend
      console.log("Access request submitted:", {
        classId: classData?.id,
        className: classData?.nom,
        requestData: values,
      });

      onSuccess();
      form.resetFields();
    } catch (error) {
      console.error("Failed to submit access request:", error);
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
          <UserAddOutlined />
          Request Class Access
        </Space>
      }
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div>
        {classData && (
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Class Name:</Text>
                <br />
                <Text>{classData.nom}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Level:</Text>
                <br />
                <Text>{classData.niveau}</Text>
              </Col>
            </Row>
            {classData.etablissement && (
              <Row style={{ marginTop: 12 }}>
                <Col span={24}>
                  <Text strong>School:</Text>
                  <br />
                  <Text>{classData.etablissement.nom}</Text>
                </Col>
              </Row>
            )}
          </Card>
        )}

        <Alert
          message="Access Request"
          description="Fill out the form below to request access to this class. The class administrator will review your request and respond accordingly."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
          initialValues={{
            role: "student",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter your first name",
                  },
                ]}
              >
                <Input placeholder="Enter your first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter your last name",
                  },
                ]}
              >
                <Input placeholder="Enter your last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              {
                required: true,
                message: "Please enter your email address",
              },
              {
                type: "email",
                message: "Please enter a valid email address",
              },
            ]}
          >
            <Input
              placeholder="Enter your email address"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Requested Role"
            rules={[
              {
                required: true,
                message: "Please select your role",
              },
            ]}
          >
            <Select placeholder="Select your role">
              <Option value="student">Student</Option>
              <Option value="teacher">Teacher</Option>
              <Option value="assistant">Teaching Assistant</Option>
              <Option value="observer">Observer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Request"
            rules={[
              {
                required: true,
                message: "Please provide a reason for your request",
              },
              {
                min: 20,
                message: "Please provide at least 20 characters",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Please explain why you want to join this class and how you're associated with it..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="additionalInfo"
            label="Additional Information (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Any additional information that might help with your request..."
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Alert
            message="What happens next?"
            description={
              <div>
                <Text>
                  1. Your request will be sent to the class administrator
                </Text>
                <br />
                <Text>2. You'll receive an email confirmation</Text>
                <br />
                <Text>
                  3. The administrator will review and respond to your request
                </Text>
                <br />
                <Text>4. You'll be notified of the decision via email</Text>
              </div>
            }
            type="success"
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
                icon={<SendOutlined />}
              >
                Submit Request
              </Button>
            </Space>
          </div>
        </Form>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            <BookOutlined style={{ marginRight: 4 }} />
            Make sure to provide accurate information to help with the approval
            process.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default RequestAccessModal;
