import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateSessionId } from '@/utils/sessionUtils';
import { SliceStatus } from '@/redux/model';

type InitialState = {
    value: CookiesState;
};

type CookiesState = {
    cookiesId: string;
    // utmData: Record<string, any>;
    status: SliceStatus;
    error: string | null;
};

const initialState = {
    value: {
        cookiesId: '',
        status: SliceStatus.IDLE,
        error: null,
    } as CookiesState,
} as InitialState;

export const initCookies = createAsyncThunk(
    'cookies/initCookies',
    async (_, { getState }) => {
      const state = getState() as { cookies: InitialState };
      if (!state.cookies.value.cookiesId) {
        return await generateSessionId(window.navigator);
      }
      return state.cookies.value.cookiesId;
    }
  );

export const cookiesSlice = createSlice({
    name: 'cookiesSlice',
    initialState,
    reducers: {
        // setUtmData: (state, action: PayloadAction<Record<string, any>>) => {
        //     state.value.utmData = action.payload;
        // },
        // clearState: (state) => {
        //     state.value = initialState.value as CookiesState;
        // },
    },
    extraReducers: (builder) => {
        builder
          .addCase(initCookies.pending, (state) => {
            state.value.status = SliceStatus.LOADING;
          })
          .addCase(initCookies.fulfilled, (state, action) => {
            state.value.status = SliceStatus.SUCCEEDED;
            state.value.cookiesId = action.payload;
          })
          .addCase(initCookies.rejected, (state, action) => {
            state.value.status = SliceStatus.FAILED;
            state.value.error = action.error.message || null;
          });
      },
});

export const {
    // setUtmData,
    // clearState
} = cookiesSlice.actions;
export default cookiesSlice.reducer;
