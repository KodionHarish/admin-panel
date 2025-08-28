// store/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    userAlerts: {},
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: action.payload.type || "info",
        severity: action.payload.severity || "info",
        message: action.payload.message,
        userId: action.payload.userId,
        userName: action.payload.userName,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: false,
      };

      state.notifications.unshift(notification);
      state.unreadCount += 1;
      
      state.userAlerts[action.payload.userId] = {
        ...notification,
        count: (state.userAlerts[action.payload.userId]?.count || 0) + 1,
      };
    },
    
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
      state.userAlerts = {};
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.userAlerts = {};
    },
    
    clearUserAlert: (state, action) => {
      delete state.userAlerts[action.payload];
    },
  },
});

export const { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  clearAllNotifications,
  clearUserAlert 
} = notificationSlice.actions;

export default notificationSlice.reducer;