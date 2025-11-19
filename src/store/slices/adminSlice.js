// store/slices/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "../../services/userService";

// Async Thunks
export const fetchAdmins = createAsyncThunk(
  "admin/fetchAdmins",
  async (_, { rejectWithValue }) => {
    try {
      const usersData = await userService.getAllUsers();
      return usersData?.filter((user) => user.admin === true) || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAdmin = createAsyncThunk(
  "admin/createAdmin",
  async (adminData, { rejectWithValue }) => {
    try {
      return await userService.createUser(adminData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAdmin = createAsyncThunk(
  "admin/updateAdmin",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await userService.updateUser(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  "admin/deleteAdmin",
  async (adminId, { rejectWithValue }) => {
    try {
      await userService.deleteUser(adminId);
      return adminId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to apply filters
const filterAdmins = (admins, searchTerm, filterStatus) => {
  let filtered = admins || [];

  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (admin) =>
        admin.nom?.toLowerCase().includes(search) ||
        admin.prenom?.toLowerCase().includes(search) ||
        admin.email?.toLowerCase().includes(search)
    );
  }

  if (filterStatus !== "all") {
    filtered = filtered.filter((admin) => admin.etat === filterStatus);
  }

  return filtered;
};

const initialState = {
  admins: [],
  filteredAdmins: [],
  loading: false,
  error: null,
  success: null,
  searchTerm: "",
  filterStatus: "all",
  viewMode: "grid",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.filteredAdmins = filterAdmins(
        state.admins,
        state.searchTerm,
        state.filterStatus
      );
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
      state.filteredAdmins = filterAdmins(
        state.admins,
        state.searchTerm,
        state.filterStatus
      );
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    applyFilters: (state) => {
      state.filteredAdmins = filterAdmins(
        state.admins,
        state.searchTerm,
        state.filterStatus
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admins
      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = action.payload;
        state.filteredAdmins = filterAdmins(
          action.payload,
          state.searchTerm,
          state.filterStatus
        );
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Admin
      .addCase(createAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins.unshift(action.payload);
        state.filteredAdmins = filterAdmins(
          state.admins,
          state.searchTerm,
          state.filterStatus
        );
        state.success = "Administrateur créé avec succès !";
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Admin
      .addCase(updateAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.admins.findIndex(
          (admin) => admin.id === action.payload.id
        );
        if (index !== -1) {
          state.admins[index] = action.payload;
        }
        state.filteredAdmins = filterAdmins(
          state.admins,
          state.searchTerm,
          state.filterStatus
        );
        state.success = "Administrateur modifié avec succès !";
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Admin
      .addCase(deleteAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admins = state.admins.filter(
          (admin) => admin.id !== action.payload
        );
        state.filteredAdmins = filterAdmins(
          state.admins,
          state.searchTerm,
          state.filterStatus
        );
        state.success = "Administrateur supprimé avec succès !";
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSearchTerm,
  setFilterStatus,
  setViewMode,
  clearError,
  clearSuccess,
  applyFilters,
} = adminSlice.actions;

export default adminSlice.reducer;
