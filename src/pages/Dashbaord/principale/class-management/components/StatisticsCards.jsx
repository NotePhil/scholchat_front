// components/StatisticsCards.jsx - UPDATED VERSION WITH UNIFIED USER COUNTING
import React from "react";
import { Card, Statistic, Row, Col } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const StatisticsCards = ({ statistics, loading }) => {
  // Calculate total users (since all are showing as utilisateurs)
  const totalUsers =
    (statistics.professeurs || 0) +
    (statistics.eleves || 0) +
    (statistics.parents || 0) +
    (statistics.utilisateurs || 0);

  const statsConfig = [
    {
      key: "totalUsers",
      title: "Total Utilisateurs",
      value: totalUsers,
      icon: <UsergroupAddOutlined />,
      color: "#1890ff",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      key: "professeurs",
      title: "Professeurs",
      value: statistics.professeurs || 0,
      icon: <UserOutlined />,
      color: "#52c41a",
      gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
    },
    {
      key: "eleves",
      title: "Élèves",
      value: statistics.eleves || 0,
      icon: <TeamOutlined />,
      color: "#faad14",
      gradient: "linear-gradient(135deg, #faad14 0%, #ffd666 100%)",
    },
    {
      key: "parents",
      title: "Parents",
      value: statistics.parents || 0,
      icon: <TeamOutlined />,
      color: "#9f7aea",
      gradient: "linear-gradient(135deg, #9f7aea 0%, #b794f6 100%)",
    },
    {
      key: "accessRequests",
      title: "Demandes d'accès",
      value: statistics.accessRequests || 0,
      icon: <ClockCircleOutlined />,
      color: "#fa541c",
      gradient: "linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)",
    },
  ];

  return (
    <div style={{ marginBottom: "24px" }}>
      <Row gutter={[16, 16]}>
        {statsConfig.map((stat) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={stat.key}>
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "16px",
                border: "1px solid #e8e8e8",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                height: "140px",
                position: "relative",
                overflow: "hidden",
              }}
              bodyStyle={{
                padding: "20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
              hoverable
            >
              {/* Background gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: stat.gradient,
                  opacity: 0.05,
                  zIndex: 1,
                }}
              />

              {/* Icon with gradient background */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  background: stat.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  boxShadow: `0 4px 12px ${stat.color}30`,
                  zIndex: 2,
                }}
              >
                <span style={{ color: "white", fontSize: "24px" }}>
                  {stat.icon}
                </span>
              </div>

              {/* Value */}
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#2d3748",
                  marginBottom: "8px",
                  textAlign: "center",
                  zIndex: 2,
                  lineHeight: 1,
                }}
              >
                {loading ? (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "3px solid #f3f3f3",
                      borderTop: "3px solid " + stat.color,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                ) : (
                  stat.value
                )}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#718096",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  textAlign: "center",
                  zIndex: 2,
                  lineHeight: 1.2,
                }}
              >
                {stat.title}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default StatisticsCards;
