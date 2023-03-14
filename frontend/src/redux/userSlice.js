import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";

import {getFriendshipAsync} from "./otheruser";

const initialState = {
	whatFriendship: "none",
	loading: false,
	success: false,
};

export const getFriendship = createAsyncThunk("user/getFriendship", async (id, thunkAPI) => {
	try {
		return await getFriendshipAsync(id);
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});

export const otheruserSlice = createSlice({
	name: "otheruser",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getFriendship.pending, (state) => {
				state.loading = true;
			})
			.addCase(getFriendship.fulfilled, (state, action) => {
				state.loading = false;
				state.success = true;
				state.whatFriendship = action.payload;
			})
			.addCase(getFriendship.rejected, (state) => {
				state.loading = false;
				state.success = false;
			});
	},
});

export default otheruserSlice.reducer;
