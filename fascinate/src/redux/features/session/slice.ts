import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateSessionId } from '@/utils/sessionUtils';
import { SliceStatus } from '@/redux/model';

type InitialState = {
    value: SessionState;
};

type SessionState = {
    sessionId: string;
    utmData: Record<string, any>;
    status: SliceStatus;
    error: string | null;
};

const initialState = {
    value: {
        sessionId: '',
        utmData: {},
        status: SliceStatus.IDLE,
        error: null,
    } as SessionState,
} as InitialState;

export const initSession = createAsyncThunk(
    'session/initSession',
    async (_, { getState }) => {
      const state = getState() as { session: InitialState };
      if (!state.session.value.sessionId) {
        return await generateSessionId(window.navigator);
      }
      return state.session.value.sessionId;
    }
  );

export const sessionSlice = createSlice({
    name: 'sessionSlice',
    initialState,
    reducers: {
        setUtmData: (state, action: PayloadAction<Record<string, any>>) => {
            state.value.utmData = action.payload;
        },
        // clearState: (state) => {
        //     state.value = initialState.value as SessionState;
        // },
    },
    extraReducers: (builder) => {
        builder
          .addCase(initSession.pending, (state) => {
            state.value.status = SliceStatus.LOADING;
          })
          .addCase(initSession.fulfilled, (state, action) => {
            state.value.status = SliceStatus.SUCCEEDED;
            state.value.sessionId = action.payload;
          })
          .addCase(initSession.rejected, (state, action) => {
            state.value.status = SliceStatus.FAILED;
            state.value.error = action.error.message || null;
          });
      },
});

export const {
    setUtmData,
    // clearState
} = sessionSlice.actions;
export default sessionSlice.reducer;
