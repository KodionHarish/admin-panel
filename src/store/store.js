// store.js - With Redux Persist
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notificationReducer from '../features/notificationSlice';

// Persist config for notifications only
const notificationPersistConfig = {
  key: 'notifications',
  storage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  notifications: persistReducer(notificationPersistConfig, notificationReducer),
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ 
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export default store;