import {
  configureStore,
  combineReducers,
  EnhancedStore,
} from '@reduxjs/toolkit';
import { storage as localStorage, sessionStorage } from './storages';
import { CookieStorage } from 'redux-persist-cookie-storage';
import Cookies from 'js-cookie';
import {
  persistReducer,
  persistStore,
  Persistor,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authSlice from './features/auth/slice';
import sessionSlice from './features/session/slice';
import cookiesSlice from './features/cookies/slice';


const rootReducer = combineReducers({
  authSlice: persistReducer(
    {
      key: `app-${process.env.ENV}-auth`,
      storage: sessionStorage,
    },
    authSlice,
  ),

  sessionSlice: persistReducer(
    {
      key: `app-${process.env.ENV}-session`,
      storage: sessionStorage,
    },
    sessionSlice,
  ),
  cookiesSlice: persistReducer({
      key: `app-${process.env.ENV}-cookies`,
      storage: new CookieStorage(Cookies, {
        expiration: {
          default: 365 * 86400, // Expires in one year
        },
      }),
    },
    cookiesSlice
  ),
});

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  (store as EnhancedStore & { __persistor: Persistor }).__persistor =
    persistStore(store);

  return store;
};

// Reset all reducers to their initial state
export const resetAllState = () => (dispatch: AppDispatch) => {
  // dispatch(clearAuthState());
  // clearCommunityStates(dispatch);
  // clearFlowsStates(dispatch);
  // dispatch(clearMbtiState());
  // dispatch(clearIsGeneratedMootiezState());
  // dispatch(clearSurveyJsState());


  // Purge the persistor
  const persistor = (makeStore() as EnhancedStore & { __persistor: Persistor })
    .__persistor;
  persistor.purge();
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// =================================================================================================
