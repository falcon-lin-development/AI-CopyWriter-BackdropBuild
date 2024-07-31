/**
 * Most operations moved to @dttd-io/dg-auth-lib
 * Now only states are managed here
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitialState = {
  value: AuthState;
};

type AuthState = {
  login: {
    email: string;
    agreedToTerms: boolean;
    errorMessage: string;
    successMessage: string;
    resendCountDown: number;
  };
};

const initialState = {
  value: {
    login: {
      email: '',
      agreedToTerms: true,
      errorMessage: '',
      successMessage: '',
      resendCountDown: 0,
    },
  } as AuthState,
} as InitialState;

export const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setEmail: (state, action: PayloadAction<string>) => {
      state.value.login.email = action.payload;
    },
    setAgreedToTerms: (state, action: PayloadAction<boolean>) => {
      state.value.login.agreedToTerms = action.payload;
    },
    setErrorMessage: (state, action: PayloadAction<string>) => {
      state.value.login.errorMessage = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string>) => {
      state.value.login.successMessage = action.payload;
    },
    setResendCountDown: (state, action: PayloadAction<number>) => {
      state.value.login.resendCountDown = action.payload;
    },
    clearState: (state) => {
      state.value = initialState.value;
    },
  },
});

export const validateEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};
export const {
  setEmail,
  setAgreedToTerms,
  setErrorMessage,
  setSuccessMessage,
  setResendCountDown,
  clearState,
} = auth.actions;
export default auth.reducer;
