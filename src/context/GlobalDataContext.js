// src/contexts/GlobalDataContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { scholchatService } from "../services/ScholchatService";

// Create the context
const GlobalDataContext = createContext();

// Cache implementation
const globalCache = {
  data: {
    users: [],
    professors: [],
    parents: [],
    students: [],
    classes: [],
    establishments: [],
    lastUpdated: null,
  },
  isFetching: false,
  subscribers: new Set(),
};

// Cache update function
const updateCache = (key, newData) => {
  globalCache.data[key] = newData;
  globalCache.data.lastUpdated = Date.now();
  globalCache.isFetching = false;
  globalCache.subscribers.forEach((callback) => callback(globalCache.data));
};

// Provider component
export const GlobalDataProvider = ({ children }) => {
  const [globalData, setGlobalData] = useState(globalCache.data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to cache updates
  useEffect(() => {
    const handleCacheUpdate = (data) => {
      setGlobalData(data);
    };

    globalCache.subscribers.add(handleCacheUpdate);
    return () => {
      globalCache.subscribers.delete(handleCacheUpdate);
    };
  }, []);

  // Generic fetch function with caching
  const fetchData = useCallback(async (endpoint, key, forceRefresh = false) => {
    // Return cached data if it's fresh (less than 5 minutes old)
    const cacheAge = Date.now() - (globalCache.data.lastUpdated || 0);
    const isCacheValid =
      !forceRefresh && globalCache.data[key]?.length > 0 && cacheAge < 300000;

    if (isCacheValid) {
      return globalCache.data[key];
    }

    // Prevent duplicate requests
    if (globalCache.isFetching) {
      return globalCache.data[key] || [];
    }

    try {
      globalCache.isFetching = true;
      setLoading(true);
      setError(null);

      const data = await scholchatService[endpoint]();
      updateCache(key, data);
      return data;
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      setError(`Failed to load ${key}`);
      return globalCache.data[key] || [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Specific data fetch functions
  const fetchUsers = useCallback(
    (forceRefresh = false) => fetchData("getAllUsers", "users", forceRefresh),
    [fetchData]
  );

  const fetchProfessors = useCallback(
    (forceRefresh = false) =>
      fetchData("getAllProfessors", "professors", forceRefresh),
    [fetchData]
  );

  // Add more specific fetch functions as needed...

  // Real-time update handler
  const handleRealTimeUpdate = useCallback((event) => {
    const { type, data } = event.detail;
    switch (type) {
      case "USER_CREATED":
        updateCache("users", [...globalCache.data.users, data]);
        break;
      case "PROFESSOR_UPDATED":
        updateCache(
          "professors",
          globalCache.data.professors.map((p) => (p.id === data.id ? data : p))
        );
        break;
      // Add more cases as needed
    }
  }, []);

  // Set up real-time event listener
  useEffect(() => {
    window.addEventListener("globalDataUpdate", handleRealTimeUpdate);
    return () => {
      window.removeEventListener("globalDataUpdate", handleRealTimeUpdate);
    };
  }, [handleRealTimeUpdate]);

  return (
    <GlobalDataContext.Provider
      value={{
        data: globalData,
        loading,
        error,
        fetchUsers,
        fetchProfessors,
        // Add more fetch functions here
        refreshAll: async () => {
          await Promise.all([
            fetchUsers(true),
            fetchProfessors(true),
            // Add more refresh calls here
          ]);
        },
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

// Custom hook for easy access
export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error("useGlobalData must be used within a GlobalDataProvider");
  }
  return context;
};
