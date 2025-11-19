import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import activitiesReducer from "./slices/activitiesSlice";
import dataReducer from "./slices/dataSlice";
import adminReducer from "./slices/adminSlice";
import classesReducer from "./slices/classesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    activities: activitiesReducer,
    data: dataReducer,
    admin: adminReducer,
    classes: classesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;
