// src/services/parentAccessService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8486/scholchat/acceder";

export const validateTokenAndGetClassInfo = async (token, classId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/infos-classe`, {
      params: { token, classId },
    });
    return response.data;
  } catch (error) {
    console.error("Error validating token:", error);
    throw error;
  }
};

export const submitAccessRequest = async (requestData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/demande`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error submitting access request:", error);
    throw error;
  }
};
