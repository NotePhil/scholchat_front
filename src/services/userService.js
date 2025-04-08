import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

// Create axios instance with common configuration
const userApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

class UserService {
  // Error Handler
  handleError(error) {
    if (error.response) {
      console.error("Server Error:", error.response.data);
      throw new Error(error.response.data.message || "Server error occurred");
    } else if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error("Network error occurred");
    } else {
      console.error("Request Error:", error.message);
      throw new Error("Error setting up request");
    }
  }

  // Get all users - No authentication token required
  async getAllUsers() {
    try {
      const response = await userApi.get("/utilisateurs");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

}

export const userService = new UserService();
