import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks pour les données globales
export const fetchUsers = createAsyncThunk(
  "data/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      // Implémentez votre service ici
      // return await userService.getAllUsers();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  professors: [],
  classes: [],
  establishments: [],
  lastUpdated: {},
  loading: {},
  errors: {},
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setData: (state, action) => {
      const { key, data } = action.payload;
      state[key] = data;
      state.lastUpdated[key] = Date.now();
      state.loading[key] = false;
      state.errors[key] = null;
    },
    setLoading: (state, action) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
    setError: (state, action) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
      state.loading[key] = false;
    },
    clearError: (state, action) => {
      const key = action.payload;
      state.errors[key] = null;
    },
  },
  extraReducers: (builder) => {
    // Ajoutez vos extraReducers pour les thunks globaux
  },
});

export const { setData, setLoading, setError, clearError } = dataSlice.actions;

export default dataSlice.reducer;
