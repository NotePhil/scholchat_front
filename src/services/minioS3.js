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

      console.log("Generating upload URL with request:", request);

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
      console.error("Failed to generate upload URL:", error);
      throw new Error(
        `Failed to generate upload URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFileToMinio(presignedUrl, file, contentType) {
    try {
      console.log("Uploading file to MinIO:", file.name);

      const uploadResponse = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": contentType,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log("File uploaded successfully to MinIO");
      return {
        success: true,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      };
    } catch (error) {
      console.error("Failed to upload file to MinIO:", error);
      throw new Error(
        `Failed to upload file: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFile(file, mediaType = "DOCUMENT", documentType = "general") {
    try {
      console.log("Starting file upload process:", file.name);

      const uploadUrlData = await this.generateUploadUrl(
        file.name,
        file.type,
        mediaType,
        documentType
      );

      await this.uploadFileToMinio(uploadUrlData.uploadUrl, file, file.type);

      return {
        success: true,
        fileName: uploadUrlData.fileName,
        mediaType: uploadUrlData.mediaType,
        documentType: uploadUrlData.documentType,
        ownerId: uploadUrlData.ownerId,
        fileSize: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error("Upload process failed:", error);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files,
    mediaType = "DOCUMENT",
    documentType = "general"
  ) {
    try {
      const uploadPromises = Array.from(files).map((file) =>
        this.uploadFile(file, mediaType, documentType)
      );

      const results = await Promise.allSettled(uploadPromises);

      const successful = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failed = results
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);

      return {
        successful,
        failed,
        total: files.length,
        successCount: successful.length,
        failureCount: failed.length,
      };
    } catch (error) {
      console.error("Multiple file upload failed:", error);
      throw error;
    }
  }

  async getMediaById(mediaId) {
    try {
      console.log("Fetching media by ID:", mediaId);
      const response = await minioApi.get(`/media/${mediaId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get media by ID:", error);
      throw new Error(
        `Failed to get media: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async generateDownloadUrl(mediaId) {
    try {
      console.log("Generating download URL for media ID:", mediaId);
      const response = await minioApi.get(`/media/${mediaId}/download-url`);
      return {
        downloadUrl: response.data.url,
        fileName: response.data.fileName,
        contentType: response.data.contentType,
        ownerId: response.data.ownerId,
      };
    } catch (error) {
      console.error("Failed to generate download URL:", error);
      throw new Error(
        `Failed to generate download URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async generateDownloadUrlByPath(filePath) {
    try {
      console.log("Generating download URL by path:", filePath);

      // Use the correct endpoint structure - check your backend API
      const response = await minioApi.get("/media/download-by-path", {
        params: { filePath },
      });

      return {
        downloadUrl: response.data.url,
        fileName: response.data.fileName,
        contentType: response.data.contentType,
        ownerId: response.data.ownerId,
      };
    } catch (error) {
      console.error("Failed to generate download URL by path:", error);

      // Check if it's a 404 error (media not found)
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

  async downloadFile(mediaId) {
    try {
      const downloadData = await this.generateDownloadUrl(mediaId);

      const response = await axios.get(downloadData.downloadUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: downloadData.contentType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        fileName: downloadData.fileName,
      };
    } catch (error) {
      console.error("Failed to download file:", error);
      throw new Error(
        `Failed to download file: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async downloadFileByPath(filePath) {
    try {
      const downloadData = await this.generateDownloadUrlByPath(filePath);

      const response = await axios.get(downloadData.downloadUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: downloadData.contentType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        fileName: downloadData.fileName,
      };
    } catch (error) {
      console.error("Failed to download file by path:", error);
      throw new Error(
        `Failed to download file: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async getUserMedia(userId = null) {
    try {
      const targetUserId = userId || this.getValidUserId();
      console.log("Fetching media for user:", targetUserId);

      const response = await minioApi.get(`/media/user/${targetUserId}`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to get user media:", error);
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

  async deleteMedia(mediaId) {
    try {
      console.log("Deleting media:", mediaId);
      await minioApi.delete(`/media/${mediaId}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete media:", error);
      throw new Error(
        `Failed to delete media: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async updateMediaMetadata(mediaId, updates) {
    try {
      console.log("Updating media metadata:", mediaId, updates);
      const response = await minioApi.patch(`/media/${mediaId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Failed to update media metadata:", error);
      throw new Error(
        `Failed to update media: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async transferMediaOwnership(mediaId, newOwnerId) {
    try {
      console.log("Transferring media ownership:", mediaId, "to:", newOwnerId);
      const response = await minioApi.post(
        `/media/${mediaId}/transfer-ownership`,
        null,
        {
          params: { newOwnerId },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to transfer media ownership:", error);
      throw new Error(
        `Failed to transfer ownership: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async getMediaPreviewUrl(media) {
    try {
      if (media.contentType?.startsWith("image/")) {
        const downloadData = await this.generateDownloadUrl(media.id);
        return downloadData.downloadUrl;
      }
      return null;
    } catch (error) {
      console.error("Failed to get preview URL:", error);
      return null;
    }
  }

  async uploadImage(file, documentType = "images") {
    return this.uploadFile(file, "IMAGE", documentType);
  }

  async uploadVideo(file, documentType = "videos") {
    return this.uploadFile(file, "VIDEO", documentType);
  }

  async uploadDocument(file, documentType = "documents") {
    return this.uploadFile(file, "DOCUMENT", documentType);
  }

  validateFile(file, maxSize = 10 * 1024 * 1024) {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`
      );
    }

    return true;
  }

  validateImageFile(file, maxSize = 5 * 1024 * 1024) {
    this.validateFile(file, maxSize);

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid image file type. Allowed: JPEG, PNG, GIF, WebP");
    }

    return true;
  }

  validateVideoFile(file, maxSize = 50 * 1024 * 1024) {
    this.validateFile(file, maxSize);

    const allowedTypes = ["video/mp4", "video/avi", "video/mov", "video/wmv"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid video file type. Allowed: MP4, AVI, MOV, WMV");
    }

    return true;
  }

  validateDocumentFile(file, maxSize = 20 * 1024 * 1024) {
    this.validateFile(file, maxSize);

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid document file type. Allowed: PDF, Word, Excel, Text files"
      );
    }

    return true;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getFileIcon(contentType) {
    if (contentType?.startsWith("image/")) return "🖼️";
    if (contentType?.startsWith("video/")) return "🎥";
    if (contentType?.includes("pdf")) return "📄";
    if (contentType?.includes("word")) return "📝";
    if (contentType?.includes("excel") || contentType?.includes("sheet"))
      return "📊";
    if (contentType?.includes("text")) return "📃";
    return "📁";
  }

  isImageFile(contentType) {
    return contentType?.startsWith("image/");
  }

  isVideoFile(contentType) {
    return contentType?.startsWith("video/");
  }

  isDocumentFile(contentType) {
    return (
      contentType &&
      !this.isImageFile(contentType) &&
      !this.isVideoFile(contentType)
    );
  }
}

export const minioS3Service = new MinioS3Service();
