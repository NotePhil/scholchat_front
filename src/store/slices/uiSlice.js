import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showSidebar: true,
  activeTab: "dashboard",
  isDark: false,
  currentTheme: "blue",
  currentLanguage: "fr",
  showMessaging: false,
  selectedConversation: null,
  isMobile: false,
  isCustomBreakpoint: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.showSidebar = !state.showSidebar;
    },
    setSidebar: (state, action) => {
      state.showSidebar = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      if (action.payload === "messages") {
        state.showMessaging = true;
      } else {
        state.showMessaging = false;
      }
    },
    setTheme: (state, action) => {
      state.isDark = action.payload.isDark;
      state.currentTheme = action.payload.currentTheme;
    },
    setLanguage: (state, action) => {
      state.currentLanguage = action.payload;
    },
    setMessaging: (state, action) => {
      state.showMessaging = action.payload.show;
      state.selectedConversation = action.payload.conversation || null;
    },
    setBreakpoints: (state, action) => {
      state.isMobile = action.payload.isMobile;
      state.isCustomBreakpoint = action.payload.isCustomBreakpoint;
    },
    resetUI: () => initialState,
  },
});

export const {
  toggleSidebar,
  setSidebar,
  setActiveTab,
  setTheme,
  setLanguage,
  setMessaging,
  setBreakpoints,
  resetUI,
} = uiSlice.actions;
export default uiSlice.reducer;
