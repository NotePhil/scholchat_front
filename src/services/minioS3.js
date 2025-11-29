import axios from "axios";

const BASE_URL = "http://localhost:8486/scholchat";

const minioApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

minioApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("cmr.notep.business.business.token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class MinioS3Service {
  getCurrentUser() {
    try {
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      const username = localStorage.getItem("username");
      const userRole = localStorage.getItem("userRole");

      const decodedToken = JSON.parse(
        localStorage.getItem("decodedToken") || "{}"
      );
      const authResponse = JSON.parse(
        localStorage.getItem("authResponse") || "{}"
      );

      return {
        id: userId || authResponse.userId || "unknown",
        name:
          username ||
          authResponse.username ||
          userEmail?.split("@")[0] ||
          "Current User",
        email:
          userEmail ||
          decodedToken.sub ||
          authResponse.userEmail ||
          "user@example.com",
        role: userRole || authResponse.userType || "student",
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return {
        id: "unknown",
        name: "Current User",
        email: "user@example.com",
        role: "student",
      };
    }
  }

  getValidUserId() {
    const userId = localStorage.getItem("userId");
    const authResponse = JSON.parse(
      localStorage.getItem("authResponse") || "{}"
    );

    const finalUserId = userId || authResponse.userId;

    if (!finalUserId || finalUserId.includes("@") || finalUserId === "user_1") {
      console.error("Invalid or missing userId detected:", finalUserId);
      throw new Error("Authentication error: Invalid user ID");
    }

    return finalUserId;
  }

  async generateUploadUrl(
    fileName,
    contentType,
    mediaType = "DOCUMENT",
    documentType = "general"
  ) {
    try {
      const request = {
        fileName: fileName,
        contentType: contentType,
        mediaType: mediaType,
        ownerId: this.getValidUserId(),
        documentType: documentType,
      };

      const response = await minioApi.post("/media/presigned-url", request);

      return {
        uploadUrl: response.data.url,
        fileName: response.data.fileName,
        mediaType: response.data.mediaType,
        documentType: response.data.documentType,
        ownerId: response.data.ownerId,
        success: true,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate upload URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFileToMinio(presignedUrl, file, contentType) {
    try {
      const uploadResponse = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": contentType,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload file: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFile(file, mediaType = "DOCUMENT", documentType = "general") {
    try {
      const uploadUrlData = await this.generateUploadUrl(
        file.name,
        file.type,
        mediaType,
        documentType
      );

      await this.uploadFileToMinio(uploadUrlData.uploadUrl, file, file.type);

      const userId = this.getValidUserId();
      const expectedFilePath = `users/${userId}/${mediaType.toLowerCase()}/${documentType}/${
        uploadUrlData.fileName
      }`;

      return {
        success: true,
        fileName: uploadUrlData.fileName,
        mediaType: uploadUrlData.mediaType,
        documentType: uploadUrlData.documentType,
        ownerId: uploadUrlData.ownerId,
        fileSize: file.size,
        contentType: file.type,
        filePath: expectedFilePath,
      };
    } catch (error) {
      throw error;
    }
  }

  async generateDownloadUrl(mediaId) {
    try {
      // Use backend media endpoint directly to avoid CORS issues
      const downloadUrl = `${BASE_URL}/media/${mediaId}/download`;
      
      return {
        downloadUrl: downloadUrl,
        fileName: `media_${mediaId}`,
        contentType: 'application/octet-stream',
        ownerId: this.getValidUserId(),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate download URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async generateDownloadUrlByPath(filePath) {
    try {
      // Use backend media endpoint directly to avoid CORS issues
      const downloadUrl = `${BASE_URL}/media/download-by-path?filePath=${encodeURIComponent(filePath)}`;
      
      return {
        downloadUrl: downloadUrl,
        fileName: filePath.split('/').pop() || 'file',
        contentType: 'application/octet-stream',
        ownerId: this.getValidUserId(),
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(
        `Failed to generate download URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async downloadFileByPath(filePath) {
    try {
      const downloadUrl = `${BASE_URL}/media/download-by-path?filePath=${encodeURIComponent(filePath)}`;
      
      // Use fetch with proper headers for authentication
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = filePath.split('/').pop() || 'file';

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        fileName: fileName,
      };
    } catch (error) {
      throw new Error(
        `Failed to download file: ${
          error.message
        }`
      );
    }
  }

  async getUserMedia(userId = null) {
    try {
      const targetUserId = userId || this.getValidUserId();
      const response = await minioApi.get(`/media/user/${targetUserId}`);
      return response.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(
        `Failed to get user media: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadImage(file, documentType = "images") {
    return this.uploadFile(file, "IMAGE", documentType);
  }

  async getMediaUrlByPath(filePath) {
    try {
      const downloadData = await this.generateDownloadUrlByPath(filePath);
      return downloadData.downloadUrl;
    } catch (error) {
      return null;
    }
  }

  async getMediaUrlById(mediaId) {
    try {
      const downloadData = await this.generateDownloadUrl(mediaId);
      return downloadData.downloadUrl;
    } catch (error) {
      return null;
    }
  }
}

export const minioS3Service = new MinioS3Service();