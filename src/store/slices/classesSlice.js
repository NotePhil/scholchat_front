import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import classService from "../../services/ClassService";
import establishmentService from "../../services/EstablishmentService";

// Async Thunks
export const fetchClasses = createAsyncThunk(
  "class/fetchClasses",
  async (_, { rejectWithValue }) => {
    try {
      return await classService.getAllClasses();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchEstablishments = createAsyncThunk(
  "class/fetchEstablishments",
  async (_, { rejectWithValue }) => {
    try {
      return await establishmentService.getAllEstablishments();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createClass = createAsyncThunk(
  "class/createClass",
  async (classData, { rejectWithValue }) => {
    try {
      return await classService.createClass(classData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateClass = createAsyncThunk(
  "class/updateClass",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await classService.updateClass(id, data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const approveClass = createAsyncThunk(
  "class/approveClass",
  async (classId, { rejectWithValue }) => {
    try {
      return await classService.approveClass(classId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rejectClass = createAsyncThunk(
  "class/rejectClass",
  async ({ classId, reason }, { rejectWithValue }) => {
    try {
      return await classService.rejectClass(classId, reason);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const activateClass = createAsyncThunk(
  "class/activateClass",
  async (classId, { rejectWithValue }) => {
    try {
      return await classService.activateClass(classId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deactivateClass = createAsyncThunk(
  "class/deactivateClass",
  async ({ classId, reason }, { rejectWithValue }) => {
    try {
      return await classService.deactivateClass(classId, reason);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const requestClassAccess = createAsyncThunk(
  "class/requestAccess",
  async ({ token, role }, { rejectWithValue }) => {
    try {
      return await classService.requestClassAccess(token, role);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getClassByToken = createAsyncThunk(
  "class/getByToken",
  async (token, { rejectWithValue }) => {
    try {
      return await classService.getClassByToken(token);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createEstablishment = createAsyncThunk(
  "class/createEstablishment",
  async (establishmentData, { rejectWithValue }) => {
    try {
      return await establishmentService.createEstablishment(establishmentData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to filter classes
const filterClasses = (classes, searchTerm, currentTab, user) => {
  let filtered = classes || [];

  // Apply search filter
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (cls) =>
        cls.nom?.toLowerCase().includes(search) ||
        cls.matiere?.toLowerCase().includes(search) ||
        cls.professeur?.nom?.toLowerCase().includes(search) ||
        cls.etablissement?.nom?.toLowerCase().includes(search)
    );
  }

  // Apply status filter
  if (currentTab !== "all") {
    const statusMap = {
      active: "ACTIF",
      inactive: "INACTIF",
      pending: "EN_ATTENTE",
    };
    filtered = filtered.filter((cls) => cls.statut === statusMap[currentTab]);
  }

  // Apply role-based filter
  if (user) {
    if (user.role === "PROFESSEUR") {
      filtered = filtered.filter((cls) => cls.professeur?.id === user.id);
    } else if (user.role === "ETABLISSEMENT") {
      filtered = filtered.filter(
        (cls) => cls.etablissement?.id === user.etablissementId
      );
    }
  }

  return filtered;
};

const initialState = {
  classes: [],
  establishments: [],
  filteredClasses: [],
  selectedClass: null,
  loading: false,
  error: null,
  success: null,
  searchTerm: "",
  currentTab: "active",
  generatedToken: null,
};

const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload;
    },
    setSelectedClass: (state, action) => {
      state.selectedClass = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearGeneratedToken: (state) => {
      state.generatedToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Establishments
      .addCase(fetchEstablishments.fulfilled, (state, action) => {
        state.establishments = action.payload;
      })
      // Create Class
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes.unshift(action.payload);
        state.generatedToken = action.payload.token;
        state.success = "Classe créée avec succès !";
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Class
      .addCase(approveClass.fulfilled, (state, action) => {
        const index = state.classes.findIndex(
          (cls) => cls.id === action.payload.id
        );
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        state.success = "Classe approuvée avec succès !";
      })
      // Reject Class
      .addCase(rejectClass.fulfilled, (state, action) => {
        const index = state.classes.findIndex(
          (cls) => cls.id === action.payload.id
        );
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        state.success = "Classe rejetée";
      })
      // Activate Class
      .addCase(activateClass.fulfilled, (state, action) => {
        const index = state.classes.findIndex(
          (cls) => cls.id === action.payload.id
        );
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        state.success = "Classe activée avec succès !";
      })
      // Deactivate Class
      .addCase(deactivateClass.fulfilled, (state, action) => {
        const index = state.classes.findIndex(
          (cls) => cls.id === action.payload.id
        );
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        state.success = "Classe désactivée";
      })
      // Request Access
      .addCase(requestClassAccess.fulfilled, (state) => {
        state.success = "Demande d'accès envoyée avec succès !";
      })
      // Get Class by Token
      .addCase(getClassByToken.fulfilled, (state, action) => {
        state.selectedClass = action.payload;
      })
      // Create Establishment
      .addCase(createEstablishment.fulfilled, (state, action) => {
        state.establishments.unshift(action.payload);
        state.success = "Établissement créé avec succès !";
      });
  },
});

export const {
  setSearchTerm,
  setCurrentTab,
  setSelectedClass,
  clearError,
  clearSuccess,
  clearGeneratedToken,
} = classSlice.actions;

export default classSlice.reducer;
