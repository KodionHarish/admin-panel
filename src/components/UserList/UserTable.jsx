// components/UserTable.jsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Button,
  Typography,
  TablePagination,
  Chip,
  Tooltip,
} from "@mui/material";
import { Send, CheckCircle, AlertCircle, AlertTriangle, Info, XCircle, Bell } from "lucide-react";

const UserTable = ({
  paginatedData,
  selectedUsers,
  userAlerts,
  onToggleUser,
  onNotifyClick,
  isLoading,
  // Pagination props
  filterData,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
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

  const getAlertColor = (severity) => {
    switch (severity) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table aria-label="users table">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Name</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Status</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Toggle</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Alerts</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Total Active Time</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Send Notification</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((user) => (
              <TableRow
                key={user.id}
                hover
                sx={{
                  backgroundColor: selectedUsers.includes(user.id)
                    ? "rgba(25, 118, 210, 0.08)"
                    : "inherit",
                  "&:hover": {
                    backgroundColor: selectedUsers.includes(user.id)
                      ? "rgba(25, 118, 210, 0.12)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      user?.activeStatus ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-xs text-gray-600">
                    {user?.activeStatus ? "Online" : "Offline"}
                  </span>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onToggleUser(user.id)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  {userAlerts[user.id] ? (
                    <Tooltip title={userAlerts[user.id].message}>
                      <Chip
                        icon={getAlertIcon(userAlerts[user.id].severity)}
                        label={userAlerts[user.id].count}
                        color={getAlertColor(userAlerts[user.id].severity)}
                        size="small"
                        variant="outlined"
                        onClick={(e) => e.preventDefault()}
                      />
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {user.totalActiveHours || "-"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Send className="w-4 h-4" />}
                    onClick={() => onNotifyClick(user)}
                    disabled={isLoading}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.875rem",
                    }}
                  >
                    Notify
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  No users found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={filterData.length}
        page={page}
        onPageChange={onChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </TableContainer>
  );
};

export default UserTable;