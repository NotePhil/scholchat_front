import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { activityFeedService } from "../../services/ActivityFeedService";

// Async Thunks
export const fetchActivities = createAsyncThunk(
  "activities/fetchActivities",
  async (_, { rejectWithValue }) => {
    try {
      return await activityFeedService.getActivities();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  "activities/createEvent",
  async (eventData, { rejectWithValue }) => {
    try {
      return await activityFeedService.createEvent(eventData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const editEvent = createAsyncThunk(
  "activities/editEvent",
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      const updatedEvent = await activityFeedService.editEvent(eventId, eventData);
      return { eventId, updatedEvent };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "activities/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      await activityFeedService.deleteEvent(eventId);
      return eventId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addReaction = createAsyncThunk(
  "activities/addReaction",
  async ({ activityId, reactionType }, { rejectWithValue }) => {
    try {
      const result = await activityFeedService.addReaction(
        activityId,
        reactionType
      );
      return { activityId, result };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  "activities/addComment",
  async ({ activityId, comment }, { rejectWithValue }) => {
    try {
      const newComment = await activityFeedService.commentOnActivity(
        activityId,
        comment
      );
      return { activityId, newComment };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const shareActivity = createAsyncThunk(
  "activities/shareActivity",
  async (activityId, { rejectWithValue }) => {
    try {
      await activityFeedService.shareActivity(activityId);
      return activityId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinEvent = createAsyncThunk(
  "activities/joinEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      await activityFeedService.joinEvent(eventId);
      return eventId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  activities: [],
  filteredActivities: [],
  loading: false,
  error: null,
  success: null,
  activeFilter: "all",
  currentUser: null,
  showCreateForm: false,
};

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
      state.filteredActivities = activityFeedService.applyFilter(
        state.activities,
        action.payload
      );
    },
    setShowCreateForm: (state, action) => {
      state.showCreateForm = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    applyFilters: (state) => {
      state.filteredActivities = activityFeedService.applyFilter(
        state.activities,
        state.activeFilter
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Activities
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
        state.filteredActivities = activityFeedService.applyFilter(
          action.payload,
          state.activeFilter
        );
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.activities.unshift(action.payload);
        state.filteredActivities = activityFeedService.applyFilter(
          state.activities,
          state.activeFilter
        );
        state.showCreateForm = false;
        state.success = "Événement créé avec succès !";
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { activityId, result } = action.payload;
        const activity = state.activities.find((a) => a.id === activityId);
        if (activity) {
          activity.isLiked = result;
          activity.likes = result
            ? activity.likes + 1
            : Math.max(0, activity.likes - 1);
        }
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { activityId, newComment } = action.payload;
        const activity = state.activities.find((a) => a.id === activityId);
        if (activity) {
          if (!activity.comments) activity.comments = [];
          activity.comments.push(newComment);
        }
      })
      // Share Activity
      .addCase(shareActivity.fulfilled, (state, action) => {
        const activity = state.activities.find((a) => a.id === action.payload);
        if (activity) {
          activity.shares = (activity.shares || 0) + 1;
          activity.isShared = true;
          state.success = "Activité partagée !";
        }
      })
      // Join Event
      .addCase(joinEvent.fulfilled, (state, action) => {
        const activity = state.activities.find((a) => a.id === action.payload);
        if (activity && activity.eventDetails) {
          activity.eventDetails.participantsCount =
            (activity.eventDetails.participantsCount || 0) + 1;
          state.success = "Vous avez rejoint l'événement !";
        }
      })
      // Edit Event
      .addCase(editEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editEvent.fulfilled, (state, action) => {
        state.loading = false;
        const { eventId, updatedEvent } = action.payload;
        const index = state.activities.findIndex((a) => a.id === eventId);
        if (index !== -1) {
          state.activities[index] = updatedEvent;
          state.filteredActivities = activityFeedService.applyFilter(
            state.activities,
            state.activeFilter
          );
        }
        state.success = "Activité modifiée avec succès !";
      })
      .addCase(editEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        const eventId = action.payload;
        state.activities = state.activities.filter((a) => a.id !== eventId);
        state.filteredActivities = activityFeedService.applyFilter(
          state.activities,
          state.activeFilter
        );
        state.success = "Activité supprimée avec succès !";
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveFilter,
  setShowCreateForm,
  setCurrentUser,
  clearError,
  clearSuccess,
  applyFilters,
} = activitiesSlice.actions;

export default activitiesSlice.reducer;
