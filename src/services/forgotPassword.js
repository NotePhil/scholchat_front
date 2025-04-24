import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat";

class ForgotPasswordService {
  // Request password reset (sends email with token)
  async requestPasswordReset(email) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password-request?email=${encodeURIComponent(
          email
        )}`,
        {}, // Empty body or null
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Password reset request error:", error);
      // Propager l'erreur au composant
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(passwordResetData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        {
          token: passwordResetData.token,
          newPassword: passwordResetData.password,
          confirmPassword: passwordResetData.confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  // Validate reset token
  async validateResetToken(token) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/validate-reset-token?token=${encodeURIComponent(
          token
        )}`
      );
      return response.data;
    } catch (error) {
      console.error("Token validation error:", error);
      throw error;
    }
  }
}

export default new ForgotPasswordService();
