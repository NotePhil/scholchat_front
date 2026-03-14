import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

class NotificationService {
  handleError(error) {
    if (error.response) {
      console.error("Notification API Error:", error.response.data);
      throw new Error(
        error.response.data.message || "Server error occurred"
      );
    } else if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error("Network error occurred");
    } else {
      console.error("Request Error:", error.message);
      throw new Error("Error setting up request");
    }
  }

  /**
   * Get all notifications for the authenticated user
   */
  async getUserNotifications() {
    try {
      const response = await api.get("/notifications");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get only unread notifications for the authenticated user
   */
  async getUnreadNotifications() {
    try {
      const response = await api.get("/notifications/unread");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get the count of unread notifications
   */
  async getUnreadCount() {
    try {
      const response = await api.get("/notifications/count");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete all notifications for the authenticated user
   */
  async deleteAllNotifications() {
    try {
      await api.delete("/notifications/all");
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const notificationService = new NotificationService();
