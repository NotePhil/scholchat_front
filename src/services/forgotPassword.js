import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat";

class ForgotPasswordService {
  // Request password reset (sends email with token)
  async requestPasswordReset(email) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password-request?email=${encodeURIComponent(email)}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword({ token, password, confirmPassword }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        {
          token,
          newPassword: password,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: function (status) {
            return status === 200; // Only consider status 200 as successful
          },
        }
      );
      
      // If we get here, the request was successful (status 200)
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }
}

export default new ForgotPasswordService();