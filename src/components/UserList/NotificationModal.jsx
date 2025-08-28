// components/NotificationModal.jsx
import { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Search,
  FilterX
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, unread, read

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

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filterType === "unread") {
      filtered = filtered.filter(n => !n.read);
    } else if (filterType === "read") {
      filtered = filtered.filter(n => n.read);
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.userName?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.type?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [notifications, searchTerm, filterType]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setFilterType("all");
  };

  const handleClose = () => {
    // Reset search when closing modal
    setSearchTerm("");
    setFilterType("all");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Badge badgeContent={unreadCount} color="error">
              <Bell className="w-5 h-5" />
            </Badge>
            <Typography variant="h6">System Notifications</Typography>
            {notifications.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                ({filteredNotifications.length} of {notifications.length})
              </Typography>
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
            <IconButton onClick={handleClose}>
              <X className="w-5 h-5" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Search and Filter Section */}
        {notifications.length > 0 && (
          <Box mb={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notifications by user, message, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="w-4 h-4 text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (searchTerm || filterType !== "all") && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={handleClearSearch}
                      title="Clear filters"
                    >
                      <FilterX className="w-4 h-4" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />
            
            {/* Filter Chips */}
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={`All (${notifications.length})`}
                size="small"
                variant={filterType === "all" ? "filled" : "outlined"}
                onClick={() => setFilterType("all")}
                sx={{ cursor: "pointer" }}
              />
              <Chip
                label={`Unread (${notifications.filter(n => !n.read).length})`}
                size="small"
                variant={filterType === "unread" ? "filled" : "outlined"}
                color={filterType === "unread" ? "error" : "default"}
                onClick={() => setFilterType("unread")}
                sx={{ cursor: "pointer" }}
              />
              <Chip
                label={`Read (${notifications.filter(n => n.read).length})`}
                size="small"
                variant={filterType === "read" ? "filled" : "outlined"}
                color={filterType === "read" ? "success" : "default"}
                onClick={() => setFilterType("read")}
                sx={{ cursor: "pointer" }}
              />
            </Box>
          </Box>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <Typography variant="body1" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <Typography variant="body1" color="text.secondary">
              No notifications match your search
            </Typography>
            <Button 
              size="small" 
              onClick={handleClearSearch}
              sx={{ mt: 1 }}
            >
              Clear filters
            </Button>
          </Box>
        ) : (
          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {filteredNotifications.map((notification, index) => (
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
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </IconButton>
                  )}
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;

// // components/NotificationModal.jsx
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Button,
//   Typography,
//   Box,
//   Badge,
//   IconButton,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Divider,
// } from "@mui/material";
// import { 
//   Bell, 
//   X, 
//   CheckCircle, 
//   AlertCircle, 
//   AlertTriangle, 
//   Info, 
//   XCircle 
// } from "lucide-react";

// const NotificationModal = ({
//   open,
//   onClose,
//   notifications,
//   unreadCount,
//   onMarkAsRead,
//   onClearAll,
//   onMarkAllAsRead,
// }) => {
//   const getAlertIcon = (severity) => {
//     switch (severity) {
//       case "error":
//         return <XCircle className="w-4 h-4 text-red-500" />;
//       case "warning":
//         return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
//       case "info":
//         return <Info className="w-4 h-4 text-blue-500" />;
//       default:
//         return <Bell className="w-4 h-4 text-gray-500" />;
//     }
//   };

//   const formatTimestamp = (timestamp) => {
//     return new Date(timestamp).toLocaleString();
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth="md"
//       fullWidth
//     >
//       <DialogTitle>
//         <Box
//           display="flex"
//           justifyContent="space-between"
//           alignItems="center"
//         >
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <Badge badgeContent={unreadCount} color="error">
//               <Bell className="w-5 h-5" />
//             </Badge>
//             <Typography variant="h6">System Notifications</Typography>
//           </Box>
//           <Box>
//               <Button
//                 size="small"
//                 onClick={onMarkAllAsRead}
//                 disabled={unreadCount === 0}  
//                 sx={{ mr: 1 }}
//               >
//                 Mark All as Read
//               </Button>
//             <Button
//               size="small"
//               onClick={onClearAll}
//               disabled={notifications.length === 0}
//               sx={{ mr: 1 }}
//             >
//               Clear All
//             </Button>
//             <IconButton onClick={onClose}>
//               <X className="w-5 h-5" />
//             </IconButton>
//           </Box>
//         </Box>
//       </DialogTitle>
//       <DialogContent>
//         {notifications.length === 0 ? (
//           <Box textAlign="center" py={4}>
//             <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
//             <Typography variant="body1" color="text.secondary">
//               No notifications yet
//             </Typography>
//           </Box>
//         ) : (
//           <List>
//             {notifications.map((notification, index) => (
//               <div key={notification.id}>
//                 <ListItem
//                   sx={{
//                     backgroundColor: notification.read
//                       ? "transparent"
//                       : "rgba(25, 118, 210, 0.08)",
//                     borderRadius: 1,
//                     mb: 1,
//                   }}
//                 >
//                   <ListItemIcon>
//                     {getAlertIcon(notification.severity)}
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={
//                       <Box
//                         display="flex"
//                         justifyContent="space-between"
//                         alignItems="center"
//                       >
//                         <Typography variant="subtitle2">
//                           {notification.userName} - {notification.type}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           {formatTimestamp(notification.timestamp)}
//                         </Typography>
//                       </Box>
//                     }
//                     secondary={notification.message}
//                   />
//                   {!notification.read && (
//                     <IconButton
//                       size="small"
//                       onClick={() => onMarkAsRead(notification.id)}
//                       sx={{ ml: 1 }}
//                     >
//                       <X className="w-4 h-4" />
//                     </IconButton>
//                   )}
//                 </ListItem>
//                 {index < notifications.length - 1 && <Divider />}
//               </div>
//             ))}
//           </List>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default NotificationModal;