// components/NotificationModal.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle 
} from "lucide-react";

const NotificationModal = ({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onClearAll,
  onMarkAllAsRead,
}) => {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Bell className="w-5 h-5" />
            <Typography variant="h6">System Notifications</Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" />
            )}
          </Box>
          <Box>
              <Button
                size="small"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}  
                sx={{ mr: 1 }}
              >
                Mark All as Read
              </Button>
            <Button
              size="small"
              onClick={onClearAll}
              disabled={notifications.length === 0}
              sx={{ mr: 1 }}
            >
              Clear All
            </Button>
            <IconButton onClick={onClose}>
              <X className="w-5 h-5" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {notifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <Typography variant="body1" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.read
                      ? "transparent"
                      : "rgba(25, 118, 210, 0.08)",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getAlertIcon(notification.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2">
                          {notification.userName} - {notification.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={notification.message}
                  />
                  {!notification.read && (
                    <IconButton
                      size="small"
                      onClick={() => onMarkAsRead(notification.id)}
                      sx={{ ml: 1 }}
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;