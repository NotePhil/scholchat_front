import axios from "axios";
import { applyAuthInterceptors } from "../utils/axiosConfig";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with common configuration
const userApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

applyAuthInterceptors(userApi);

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

  // Get all admin users
  async getAdmins() {
    try {
      const response = await userApi.get("/utilisateurs/admins");
      return response.data;
    } catch (error) {
      this.handleError(error);
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

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await userApi.get(`/utilisateurs/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create a new user
  async createUser(userData) {
    try {
      const response = await userApi.post("/utilisateurs", userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update an existing user
  async updateUser(id, userData) {
    try {
      const response = await userApi.patch(`/utilisateurs/${id}`, userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete a user
  async deleteUser(id) {
    try {
      await userApi.delete(`/utilisateurs/${id}`);
      return true;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const userService = new UserService();
