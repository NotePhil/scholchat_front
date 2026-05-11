import axios from "axios";

// Base URL already includes /scholchat from REACT_APP_API_BASE_URL
const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const liveSessionService = {
  // POST /cours/{coursId}/session/start  → 201 SessionResponseDTO
  startSession: (coursId, mode) =>
    api.post(`/cours/${coursId}/session/start`, { mode }).then(r => r.data),

  // GET /cours/{coursId}/session/active  → 200 SessionResponseDTO | 404
  getActiveSession: (coursId) =>
    api.get(`/cours/${coursId}/session/active`).then(r => r.data),

  // POST /cours/{coursId}/session/{sessionId}/join  → 200 SessionResponseDTO (with fresh jitsiJwt)
  joinSession: (coursId, sessionId) =>
    api.post(`/cours/${coursId}/session/${sessionId}/join`).then(r => r.data),

  // POST /cours/{coursId}/session/{sessionId}/leave  → 200 empty
  leaveSession: (coursId, sessionId) =>
    api.post(`/cours/${coursId}/session/${sessionId}/leave`).then(r => r.data),

  // POST /cours/{coursId}/session/{sessionId}/end  → 200 empty
  endSession: (coursId, sessionId) =>
    api.post(`/cours/${coursId}/session/${sessionId}/end`).then(r => r.data),

  // POST /cours/{coursId}/session/{sessionId}/chapter  body: { chapitreId }  → 200 empty
  changeChapter: (coursId, sessionId, chapitreId) =>
    api.post(`/cours/${coursId}/session/${sessionId}/chapter`, { chapitreId }).then(r => r.data),

  // POST /cours/{coursId}/progress  body: { chapitreId, completed }  → 200 ChapitreProgressDTO
  saveProgress: (coursId, chapitreId, completed) =>
    api.post(`/cours/${coursId}/progress`, { chapitreId, completed }).then(r => r.data),

  // GET /cours/{coursId}/progress  → 200 ChapitreProgressDTO[]
  getProgress: (coursId) =>
    api.get(`/cours/${coursId}/progress`).then(r => r.data),

  // GET /cours/{coursId}/sessions  → 200 SessionResponseDTO[]
  getCourseSessionHistory: (coursId) =>
    api.get(`/cours/${coursId}/sessions`).then(r => r.data),
};

export default liveSessionService;
