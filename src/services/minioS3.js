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
      console.log('=== GENERATING UPLOAD URL ===');
      console.log('Request params:', { fileName, contentType, mediaType, documentType });
      
      const request = {
        fileName: fileName,
        contentType: contentType,
        mediaType: mediaType,
        ownerId: this.getValidUserId(),
        documentType: documentType,
      };

      console.log('Sending request to /media/presigned-url:', request);
      const response = await minioApi.post("/media/presigned-url", request);
      console.log('Presigned URL response:', response.data);

      return {
        uploadUrl: response.data.url,
        fileName: response.data.fileName,
        mediaType: response.data.mediaType,
        documentType: response.data.documentType,
        ownerId: response.data.ownerId,
        success: true,
      };
    } catch (error) {
      console.error('=== UPLOAD URL GENERATION ERROR ===');
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('===================================');
      throw new Error(
        `Failed to generate upload URL: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFileToMinio(presignedUrl, file, contentType) {
    try {
      console.log('=== UPLOADING TO MINIO ===');
      console.log('Presigned URL:', presignedUrl);
      console.log('File size:', file.size, 'Content-Type:', contentType);
      
      const uploadResponse = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": contentType,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 second timeout
      });

      console.log('Upload response status:', uploadResponse.status);
      console.log('=== MINIO UPLOAD SUCCESS ===');

      return {
        success: true,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
      };
    } catch (error) {
      console.error('=== MINIO UPLOAD ERROR ===');
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('==========================');
      throw new Error(
        `Failed to upload file: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async uploadFile(file, mediaType = "DOCUMENT", documentType = "general") {
    try {
      console.log('=== MINIO UPLOAD FILE START ===');
      console.log('File:', file.name, 'MediaType:', mediaType, 'DocumentType:', documentType);
      
      const uploadUrlData = await this.generateUploadUrl(
        file.name,
        file.type,
        mediaType,
        documentType
      );

      console.log('Generated upload URL data:', uploadUrlData);

      await this.uploadFileToMinio(uploadUrlData.uploadUrl, file, file.type);

      const userId = this.getValidUserId();
      const expectedFilePath = `users/${userId}/${mediaType.toLowerCase()}/${documentType}/${
        uploadUrlData.fileName
      }`;

      const result = {
        success: true,
        fileName: uploadUrlData.fileName,
        mediaType: uploadUrlData.mediaType,
        documentType: uploadUrlData.documentType,
        ownerId: uploadUrlData.ownerId,
        fileSize: file.size,
        contentType: file.type,
        filePath: expectedFilePath,
      };
      
      console.log('Upload successful, returning:', result);
      console.log('=== MINIO UPLOAD FILE END ===');
      
      return result;
    } catch (error) {
      console.error('=== MINIO UPLOAD FILE ERROR ===');
      console.error('Error details:', error);
      console.error('===============================');
      throw error;
    }
  }

  async generateDownloadUrl(mediaId) {
    try {
      const response = await minioApi.get(`/media/${mediaId}/download-url`);
      
      return {
        downloadUrl: response.data.url,
        fileName: response.data.fileName,
        contentType: response.data.contentType,
        ownerId: response.data.ownerId,
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

  async uploadImage(file, documentType = "event_images") {
    try {
      console.log('=== MINIO UPLOAD IMAGE START ===');
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('Document Type:', documentType);

      // Generate unique filename for events
      const timestamp = Date.now() + Math.random();
      const extension = file.name.split('.').pop();
      const uniqueFileName = `${documentType}_${timestamp}.${extension}`;
      
      console.log('Generated filename:', uniqueFileName);

      // Step 1: Get presigned upload URL
      const uploadUrlData = await this.generateUploadUrl(
        uniqueFileName,
        file.type,
        "IMAGE",
        documentType
      );

      console.log('Upload URL data:', uploadUrlData);

      // Step 2: Upload file to MinIO
      await this.uploadFileToMinio(uploadUrlData.uploadUrl, file, file.type);

      // Step 3: Return the expected format for event creation
      const userId = this.getValidUserId();
      const filePath = `users/${userId}/image/${documentType}/${uniqueFileName}`;
      
      const result = {
        fileName: uniqueFileName,
        filePath: filePath,
        fileType: "IMAGE",
        contentType: file.type,
        fileSize: file.size,
        mediaType: "IMAGE",
        bucketName: "scholchat"
      };

      console.log('Upload successful, returning:', result);
      console.log('=== MINIO UPLOAD IMAGE END ===');
      
      return result;
      
    } catch (error) {
      console.error('=== MINIO UPLOAD IMAGE ERROR ===');
      console.error('Error details:', error);
      console.error('================================');
      throw new Error(`Image upload failed: ${error.message}`);
    }
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