import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Card,
  Divider,
  Radio,
  InputNumber,
  message,
  Steps,
  Row,
  Col,
  Typography,
  Alert,
} from "antd";
import {
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;

const PaymentModal = ({ visible, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentAmount] = useState(29.99); // Fixed amount for class creation

  const handlePaymentSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // In a real application, you would integrate with a payment processor like:
      // - Stripe
      // - PayPal
      // - Square
      // - etc.

      message.success("Payment processed successfully!");
      setCurrentStep(2);

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
        handleModalClose();
      }, 2000);
    } catch (error) {
      message.error("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setCurrentStep(0);
    setPaymentMethod("card");
    form.resetFields();
    onCancel();
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case "card":
        return (
          <>
            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[
                { required: true, message: "Please enter card number" },
                { len: 16, message: "Card number must be 16 digits" },
              ]}
            >
              <Input
                placeholder="1234 5678 9012 3456"
                maxLength={16}
                prefix={<CreditCardOutlined />}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="expiryDate"
                  label="Expiry Date"
                  rules={[
                    { required: true, message: "Please enter expiry date" },
                    {
                      pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
                      message: "Format: MM/YY",
                    },
                  ]}
                >
                  <Input placeholder="MM/YY" maxLength={5} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="cvv"
                  label="CVV"
                  rules={[
                    { required: true, message: "Please enter CVV" },
                    { len: 3, message: "CVV must be 3 digits" },
                  ]}
                >
                  <Input placeholder="123" maxLength={3} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="cardHolderName"
              label="Cardholder Name"
              rules={[
                { required: true, message: "Please enter cardholder name" },
              ]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
          </>
        );

      case "paypal":
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <WalletOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
            <Title level={4}>PayPal Payment</Title>
            <Text>
              You will be redirected to PayPal to complete your payment.
            </Text>
          </div>
        );

      case "bank":
        return (
          <>
            <Form.Item
              name="bankName"
              label="Bank Name"
              rules={[{ required: true, message: "Please select bank" }]}
            >
              <Select placeholder="Select your bank">
                <Option value="bank1">First National Bank</Option>
                <Option value="bank2">City Bank</Option>
                <Option value="bank3">Regional Bank</Option>
                <Option value="bank4">Community Bank</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="accountNumber"
              label="Account Number"
              rules={[
                { required: true, message: "Please enter account number" },
              ]}
            >
              <Input placeholder="Enter your account number" />
            </Form.Item>

            <Form.Item
              name="routingNumber"
              label="Routing Number"
              rules={[
                { required: true, message: "Please enter routing number" },
              ]}
            >
              <Input placeholder="Enter routing number" />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  const steps = [
    {
      title: "Payment Method",
      content: "Choose your preferred payment method",
    },
    {
      title: "Payment Details",
      content: "Enter your payment information",
    },
    {
      title: "Confirmation",
      content: "Payment successful",
    },
  ];

  return (
    <Modal
      title="Complete Payment"
      visible={visible}
      onCancel={handleModalClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      {currentStep === 0 && (
        <div>
          <Alert
            message="Class Creation Fee"
            description={`Creating a class without school association requires a one-time fee of $${paymentAmount}`}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Title level={4}>Select Payment Method</Title>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: "100%" }}
          >
            <Card style={{ marginBottom: 16 }}>
              <Radio value="card">
                <CreditCardOutlined style={{ marginRight: 8 }} />
                Credit/Debit Card
              </Radio>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <Radio value="paypal">
                <WalletOutlined style={{ marginRight: 8 }} />
                PayPal
              </Radio>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <Radio value="bank">
                <BankOutlined style={{ marginRight: 8 }} />
                Bank Transfer
              </Radio>
            </Card>
          </Radio.Group>

          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button onClick={handleModalClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => setCurrentStep(1)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Card
            title="Payment Summary"
            style={{ marginBottom: 24 }}
            size="small"
          >
            <Row justify="space-between">
              <Col>Class Creation Fee:</Col>
              <Col>
                <strong>${paymentAmount}</strong>
              </Col>
            </Row>
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Col>
                <strong>Total:</strong>
              </Col>
              <Col>
                <strong>${paymentAmount}</strong>
              </Col>
            </Row>
          </Card>

          <Form form={form} layout="vertical" onFinish={handlePaymentSubmit}>
            {renderPaymentForm()}

            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button
                onClick={() => setCurrentStep(0)}
                style={{ marginRight: 8 }}
              >
                Back
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={loading ? <LoadingOutlined /> : <CreditCardOutlined />}
              >
                {loading ? "Processing..." : `Pay $${paymentAmount}`}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <CheckCircleOutlined
            style={{ fontSize: "64px", color: "#52c41a", marginBottom: 16 }}
          />
          <Title level={3}>Payment Successful!</Title>
          <Text>
            Your payment has been processed successfully. Your class will be
            created and activated.
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default PaymentModal;
