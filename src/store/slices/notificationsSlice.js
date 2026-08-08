import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationService } from "../../services/NotificationService";

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getUserNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUnreadNotifications = createAsyncThunk(
  "notifications/fetchUnread",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getUnreadNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const count = await notificationService.getUnreadCount();
      return count;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const data = await notificationService.markAsRead(notificationId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  "notifications/deleteAll",
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.deleteAllNotifications();
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isOpen: false,
  filter: "all", // "all" | "unread"
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    toggleNotificationPanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    setNotificationPanelOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    setNotificationFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearNotificationError: (state) => {
      state.error = null;
    },
    resetNotifications: () => initialState,
    pushNotification: (state, action) => {
      const incoming = action.payload;
      const exists = state.notifications.some((n) => n.id === incoming.id);
      if (!exists) {
        state.notifications = [incoming, ...state.notifications];
        if (!incoming.read) state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
        state.unreadCount = (action.payload || []).filter(
          (n) => !n.read
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch unread notifications
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        const unread = action.payload || [];
        // Merge unread with existing read notifications
        const readNotifications = state.notifications.filter((n) => n.read);
        state.notifications = [...unread, ...readNotifications].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        state.unreadCount = unread.length;
      })

      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload || 0;
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.notifications.findIndex(
            (n) => n.id === updated.id
          );
          if (index !== -1) {
            state.notifications[index] = updated;
          }
          state.unreadCount = state.notifications.filter(
            (n) => !n.read
          ).length;
        }
      })

      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          read: true,
        }));
        state.unreadCount = 0;
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const deleted = state.notifications.find((n) => n.id === deletedId);
        state.notifications = state.notifications.filter(
          (n) => n.id !== deletedId
        );
        if (deleted && !deleted.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Delete all notifications
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const {
  toggleNotificationPanel,
  setNotificationPanelOpen,
  setNotificationFilter,
  clearNotificationError,
  resetNotifications,
  pushNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
