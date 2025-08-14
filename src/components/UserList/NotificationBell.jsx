// components/NotificationBell.jsx
import { IconButton, Badge } from "@mui/material";
import { Bell, BellRing } from "lucide-react";

const NotificationBell = ({ unreadCount, onClick }) => {
  return (
    <IconButton
      onClick={onClick}
      color="primary"
      size="large"
    >
      <Badge badgeContent={unreadCount} color="error">
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
      </Badge>
    </IconButton>
  );
};

export default NotificationBell;