


// Users.jsx - Main component with business logic
import { useState, useEffect ,useRef} from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Sidebar from "../../components/Sidebar";
import UserTable from "../../components/UserList/UserTable";
import NotificationModal from "../../components/UserList/NotificationModal";
import SendMessageModal from "../../components/UserList/SendMessageModal";
import NotificationBell from "../../components/UserList/NotificationBell";
import SearchAndFilters from "../../components/UserList/SearchAndFilters";

const UsersAll = () => {
  // ==================== STATE MANAGEMENT ====================
  // Core data state
  const [users, setUsers] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [paginatedData, setPaginatedData] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Socket and messaging state
  const [socket, setSocket] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  // User selection state with localStorage persistence
  const [selectedUsers, setSelectedUsers] = useState(() => {
    const stored = localStorage.getItem("multiSelectUsers");
    return stored ? JSON.parse(stored) : [];
  });
  const textareaRef = useRef(null);
  // Notification system state
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userAlerts, setUserAlerts] = useState({});
  const [pendingAlerts, setPendingAlerts] = useState([]);
  // const [btnDisable, setBtnDisable] = useState(true);
  // const [textCount, setTextCount] = useState(0);



  // ==================== NOTIFICATION FUNCTIONS ====================
  useEffect(() => {
    if(Notification.permission !== "granted"){
      Notification.requestPermission().then((permission) => {
        if(permission !== "granted"){
          console.log("Desktop notifications not granted");
        }
      })
    }
  },[])

  // Helper function to get user name by ID
  const getUserNameById = (userId) => {
    if (!usersLoaded || !users || users.length === 0) {
      console.warn("Users data not loaded yet");
      return "Loading...";
    }
    const user = users.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Function to add new alert to notifications
  const addUserAlert = (alertData) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: alertData.type || "info",
      severity: alertData.severity || "info",
      message: alertData.message,
      userId: alertData.userId,
      userName: alertData.userName || getUserNameById(alertData.userId),
      timestamp: alertData.timestamp || new Date().toISOString(),
      read: false,
    };

    if(Notification.permission === "granted") {
      const notif = new Notification(`⚠️ ${notification.userName || "User Alert" }`, {
        body : notification.message
      });

      notif.onclick = () => {
        window.focus();
        setShowNotificationModal(true);
        markAsRead(notification.id);
      }
    }

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    setUserAlerts((prev) => ({
      ...prev,
      [alertData.userId]: {
        ...notification,
        count: (prev[alertData.userId]?.count || 0) + 1,
      },
    }));
  };

  // Function to update user alert based on status
  const updateUserAlert = (data) => {
    const userId = data.userId;
    if (data.isOnline && data.isTracking) {
      setUserAlerts((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif.userId !== userId)
      );
    }
  };

  // Function to mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setUserAlerts({});
  };

  // ==================== API FUNCTIONS ====================
  const fetchUsers = async () => {
    try {
      setUsersLoaded(false);
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/usersLogs`,
        { withCredentials: true }
      );
      setUsers(res.data.data || []);
      setUsersLoaded(true);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsersLoaded(false);
    }
  };

  const sendNotification = async () => {
    if (!socket || !selectedUser || !notificationMessage.trim()) {
      setSendStatus("error");
      return;
    }

    setIsLoading(true);
    setSendStatus(null);

    try {
      const sendPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timeout"));
        }, 10000);

        socket.emit(
          "notify-user",
          {
            userId: selectedUser.id,
            name: selectedUser.name,
            message: notificationMessage.trim(),
          },
          (response) => {
            clearTimeout(timeout);
            if (response && response.success !== false) {
              resolve(response);
            } else {
              reject(
                new Error(response?.message || "Failed to send notification")
              );
            }
          }
        );
      });

      await sendPromise;
      setSendStatus("success");

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error("Error sending notification:", error);
      setSendStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || selectedUser.activeStatus) return;

    setIsEmailLoading(true);
    setSendStatus(null);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/notify/force-email`,
        {
          userId: selectedUser.id,
          message: notificationMessage.trim(),
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        setSendStatus("success");
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setSendStatus("error");
      }
    } catch (err) {
      console.error("Email send error:", err);
      setSendStatus("error");
    } finally {
      setIsEmailLoading(false);
    }
  };

  // ==================== EVENT HANDLERS ====================
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNotifyClick = (user) => {
    setSelectedUser(user);
    setNotificationMessage("");
    setSendStatus(null);
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setNotificationMessage("");
    setSelectedUser(null);
    setSendStatus(null);
    setIsLoading(false);
    setIsEmailLoading(false);
  };
 
  const handleMessageChange = (e) => {
    setNotificationMessage(e.target.value);
    // console.log(e.target.value.length, 'e.target.value.length');
    // if(e.target.value.length>0) {
    //     setBtnDisable(false);
    //     setTextCount(e.target.value.length);
    //   }else{
    //     setBtnDisable(true);
    //   }
  };
  
  const handleToggleUser = (userId) => {
    const isCurrentlySelected = selectedUsers.includes(userId);
    const toggled = !isCurrentlySelected;

    if (socket) {
      socket.emit("admin-toggle-user", { userId, toggled }, (response) => {
        console.log("Server acknowledgment:", response);
      });
    }

    setSelectedUsers((prev) => {
      const updated = toggled
        ? [...new Set([...prev, userId])]
        : prev.filter((id) => id !== userId);

      localStorage.setItem("multiSelectUsers", JSON.stringify(updated));
      return updated;
    });
  };

  const handleMultiSelectChange = (newValue) => {
    const ids = newValue.map((user) => user.id);
    const added = ids.filter((id) => !selectedUsers.includes(id));
    const removed = selectedUsers.filter((id) => !ids.includes(id));

    setSelectedUsers(ids);
    localStorage.setItem("multiSelectUsers", JSON.stringify(ids));

    if (socket) {
      added.forEach((id) =>
        socket.emit("admin-toggle-user", { userId: id, toggled: true })
      );
      removed.forEach((id) =>
        socket.emit("admin-toggle-user", { userId: id, toggled: false })
      );
    }
  };

  // ==================== SOCKET INITIALIZATION ====================
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_BASE_URL}`, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Admin connected to server", newSocket.id);
    });

    newSocket.on("user-status-update", (data) => {
      console.log("User status update:", data);
      updateUserAlert(data);
    });

    newSocket.on("admin-alert", (alertData) => {
      console.log("Admin alert received:", alertData);
      if (alertData.type === "user-inactive") {
        if (!usersLoaded) {
          setPendingAlerts((prev) => [...prev, alertData]);
        } else {
          addUserAlert(alertData);
        }
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Admin disconnected from server");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);
    fetchUsers();

    return () => {
      newSocket.close();
    }
  }, []);
  // Effect to process pending alerts when users data is loaded
  useEffect(() => {
    if (usersLoaded && pendingAlerts.length > 0) {
      pendingAlerts.forEach((alertData) => {
        addUserAlert(alertData);
      });
      setPendingAlerts([]);
    }
  }, [usersLoaded, pendingAlerts]);

  // ==================== DATA PROCESSING EFFECTS ====================
  useEffect(() => {
    const sortedUsers = [...users].sort((a, b) => {
      const aToggled = selectedUsers.includes(a.id);
      const bToggled = selectedUsers.includes(b.id);
      if (aToggled === bToggled) return 0;
      return bToggled - aToggled;
    });
    setFilterData(sortedUsers);
  }, [users, selectedUsers]);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sortedFiltered = [...filtered].sort((a, b) => {
      const aToggled = selectedUsers.includes(a.id);
      const bToggled = selectedUsers.includes(b.id);
      if (aToggled === bToggled) return 0;
      return bToggled - aToggled;
    });

    setFilterData(sortedFiltered);
    setPage(0);
  }, [users, selectedUsers, searchTerm]);

  useEffect(() => {
    const data = filterData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
    setPaginatedData(data);
  }, [filterData, page, rowsPerPage]);

  useEffect(() => {
    if (usersLoaded && users && users.length > 0) {
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          userName:
            notification.userName === "Loading..." ||
            notification.userName === "Unknown User"
              ? getUserNameById(notification.userId)
              : notification.userName,
        }))
      );
    }
  }, [usersLoaded, users]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold mb-1">All Users Overview</h2>
          <NotificationBell 
            unreadCount={unreadCount}
            onClick={() => setShowNotificationModal(true)}
          />
        </div>
        <p className="text-sm text-gray-600 mb-4 italic">
          Search and manage all users with activity overview and notifications.
        </p>

        <hr className="border-t border-gray-300 mb-6" />

        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          users={users}
          selectedUsers={selectedUsers}
          onMultiSelectChange={handleMultiSelectChange}
        />

        <UserTable
          paginatedData={paginatedData}
          selectedUsers={selectedUsers}
          userAlerts={userAlerts}
          onToggleUser={handleToggleUser}
          onNotifyClick={handleNotifyClick}
          isLoading={isLoading}
          // Pagination props
          filterData={filterData}
          page={page}
          rowsPerPage={rowsPerPage}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </main>

      <NotificationModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onClearAll={clearAllNotifications}
      />

      <SendMessageModal
        open={showMessageModal}
        textareaRef={textareaRef}
        onClose={handleCloseModal}
        selectedUser={selectedUser}
        notificationMessage={notificationMessage}
        // textCount={textCount}
        onMessageChange={handleMessageChange}
        onSendNotification={sendNotification}
        onSendEmail={handleSendEmail}
        isLoading={isLoading}
        isEmailLoading={isEmailLoading}
        sendStatus={sendStatus}
        // btnDisable={btnDisable}
      />
    </div>
  );
};

export default UsersAll;






// // Enhanced User.js with proper modal library and focus management
// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import Sidebar from "../../components/Sidebar";
// import {
//   TextField,
//   TablePagination,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   Typography,
//   Box,
//   CircularProgress,
//   Alert,
//   Badge,
//   IconButton,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Divider,
//   Chip,
//   Tooltip,
// } from "@mui/material";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Autocomplete,
//   Switch,
// } from "@mui/material";
// import {
//   Send,
//   X,
//   CheckCircle,
//   AlertCircle,
//   Bell,
//   BellRing,
//   AlertTriangle,
//   Info,
//   XCircle,
//   Trash2,
// } from "lucide-react";
// import { io } from "socket.io-client";

// const UsersAll = () => {
//   // ==================== STATE MANAGEMENT ====================
//   // Core data state
//   const [users, setUsers] = useState([]);
//   const [filterData, setFilterData] = useState([]);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const [usersLoaded, setUsersLoaded] = useState(false);

//   // Search and pagination state
//   const [searchTerm, setSearchTerm] = useState("");
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(5);

//   // Socket and messaging state
//   const [socket, setSocket] = useState(null);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showMessageModal, setShowMessageModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEmailLoading, setIsEmailLoading] = useState(false);
//   const [sendStatus, setSendStatus] = useState(null);

//   // User selection state with localStorage persistence
//   const [selectedUsers, setSelectedUsers] = useState(() => {
//     const stored = localStorage.getItem("multiSelectUsers");
//     return stored ? JSON.parse(stored) : [];
//   });

//   // Notification system state
//   const [notifications, setNotifications] = useState([]);
//   const [showNotificationModal, setShowNotificationModal] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [userAlerts, setUserAlerts] = useState({});
//   const [pendingAlerts, setPendingAlerts] = useState([]);

//   // Refs
//   const textareaRef = useRef(null);

//   useEffect(() => {
//     if(Notification.permission !== "granted"){
//       Notification.requestPermission().then((permission) => {
//         if(permission !== "granted"){
//           console.log("Desktop notifications not granted");
//         }
//       })
//     }
//   },[])

//   // ==================== HELPER FUNCTIONS ====================

//   // Helper function to get user name by ID - fixed to handle null users
//   const getUserNameById = (userId) => {
//     if (!usersLoaded || !users || users.length === 0) {
//       console.warn("Users data not loaded yet");
//       return "Loading...";
//     }

//     const user = users.find((u) => u.id === userId);
//     return user ? user.name : "Unknown User";
//   };

//   // Function to get alert icon based on severity
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

//   // Function to get alert color based on severity
//   const getAlertColor = (severity) => {
//     switch (severity) {
//       case "error":
//         return "error";
//       case "warning":
//         return "warning";
//       case "info":
//         return "info";
//       default:
//         return "default";
//     }
//   };

//   // Function to format timestamp
//   const formatTimestamp = (timestamp) => {
//     return new Date(timestamp).toLocaleString();
//   };

//   const getStatusIcon = () => {
//     if (sendStatus === "success")
//       return <CheckCircle className="w-4 h-4 text-green-500" />;
//     if (sendStatus === "error")
//       return <AlertCircle className="w-4 h-4 text-red-500" />;
//     return null;
//   };

//   const getStatusMessage = () => {
//     if (sendStatus === "success") return "Message sent successfully!";
//     if (sendStatus === "error")
//       return "Failed to send message. Please try again.";
//     return null;
//   };

//   // ==================== NOTIFICATION FUNCTIONS ====================

//   // Function to add new alert to notifications - fixed to handle async user data
//   const addUserAlert = (alertData) => {
//     const notification = {
//       id: Date.now() + Math.random(),
//       type: alertData.type || "info",
//       severity: alertData.severity || "info",
//       message: alertData.message,
//       userId: alertData.userId,
//       userName: alertData.userName || getUserNameById(alertData.userId),
//       timestamp: alertData.timestamp || new Date().toISOString(),
//       read: false,
//     };

//     if(Notification.permission === "granted") {
//       const notif = new Notification(`⚠️ ${notification.userName || "User Alert" }`, {
//         body : notification.message
//       });

//       notif.onclick = () => {
//         window.focus();
//         setShowNotificationModal(true);
//         markAsRead(notification.id);
//       }
//     }

//     setNotifications((prev) => [notification, ...prev]);
//     setUnreadCount((prev) => prev + 1);

//     // Update user alerts mapping
//     setUserAlerts((prev) => ({
//       ...prev,
//       [alertData.userId]: {
//         ...notification,
//         count: (prev[alertData.userId]?.count || 0) + 1,
//       },
//     }));
//   };

//   // Function to update user alert based on status
//   const updateUserAlert = (data) => {
//     const userId = data.userId;

//     // If user comes back online or tracking becomes active, clear their alerts
//     if (data.isOnline && data.isTracking) {
//       setUserAlerts((prev) => {
//         const updated = { ...prev };
//         delete updated[userId];
//         return updated;
//       });

//       // Also remove related notifications
//       setNotifications((prev) =>
//         prev.filter((notif) => notif.userId !== userId)
//       );
//     }
//   };

//   // Function to mark notification as read
//   const markAsRead = (notificationId) => {
//     setNotifications((prev) =>
//       prev.map((notif) =>
//         notif.id === notificationId ? { ...notif, read: true } : notif
//       )
//     );
//     setUnreadCount((prev) => Math.max(0, prev - 1));
//   };

//   // Function to clear all notifications
//   const clearAllNotifications = () => {
//     setNotifications([]);
//     setUnreadCount(0);
//     setUserAlerts({});
//   };

//   // ==================== API FUNCTIONS ====================

//   const fetchUsers = async () => {
//     try {
//       setUsersLoaded(false);
//       const res = await axios.get(
//         // "http://localhost:5000/api/users/usersLogs", 
//         `${process.env.REACT_APP_API_BASE_URL}/api/users/usersLogs`,
//         {
//         withCredentials: true,
//       });
//       console.log(res, "res");
//       setUsers(res.data.data || []);
//       setUsersLoaded(true);
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       setUsersLoaded(false);
//     }
//   };

//   const sendNotification = async () => {
//     if (!socket || !selectedUser || !notificationMessage.trim()) {
//       setSendStatus("error");
//       return;
//     }

//     setIsLoading(true);
//     setSendStatus(null);

//     try {
//       console.log("Sending notification to:", {
//         userId: selectedUser.id,
//         name: selectedUser.name,
//         message: notificationMessage.trim(),
//       });

//       // Create a promise wrapper for socket emission
//       const sendPromise = new Promise((resolve, reject) => {
//         const timeout = setTimeout(() => {
//           reject(new Error("Request timeout"));
//         }, 10000); // 10 second timeout

//         socket.emit(
//           "notify-user",
//           {
//             userId: selectedUser.id,
//             name: selectedUser.name,
//             message: notificationMessage.trim(),
//           },
//           (response) => {
//             clearTimeout(timeout);
//             if (response && response.success !== false) {
//               resolve(response);
//             } else {
//               reject(
//                 new Error(response?.message || "Failed to send notification")
//               );
//             }
//           }
//         );
//       });

//       const response = await sendPromise;
//       setSendStatus("success");

//       // Auto-close modal after success
//       setTimeout(() => {
//         handleCloseModal();
//       }, 1500);
//     } catch (error) {
//       console.error("Error sending notification:", error);
//       setSendStatus("error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSendEmail = async () => {
//     if (!selectedUser || selectedUser.activeStatus) return;

//     setIsEmailLoading(true);
//     setSendStatus(null);

//     try {
//       const res = await axios.post(
//         // "http://localhost:5000/api/notify/force-email",
//         `${process.env.REACT_APP_API_BASE_URL}/api/notify/force-email`,
//         {
//           userId: selectedUser.id,
//           message: notificationMessage,
//         },
//         { withCredentials: true }
//       );

//       if (res.data.success) {
//         setSendStatus("success");
//         setTimeout(() => {
//           handleCloseModal();
//         }, 1500);
//       } else {
//         setSendStatus("error");
//       }
//     } catch (err) {
//       console.error("Email send error:", err);
//       setSendStatus("error");
//     } finally {
//       setIsEmailLoading(false);
//     }
//   };

//   // ==================== EVENT HANDLERS ====================

//   const handleSearch = (e) => {
//     const searchValue = e.target.value;
//     setSearchTerm(searchValue);
//   };

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const handleNotifyClick = (user) => {
//     setSelectedUser(user);
//     setNotificationMessage("");
//     setSendStatus(null);
//     setShowMessageModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowMessageModal(false);
//     setNotificationMessage("");
//     setSelectedUser(null);
//     setSendStatus(null);
//     setIsLoading(false);
//     setIsEmailLoading(false);
//   };

//   // Handle textarea input with better event handling
//   const handleMessageChange = (e) => {
//     setNotificationMessage(e.target.value);
//     setSendStatus(null); // Reset status when user types
//   };

//   // Handle Enter key to send (Ctrl+Enter or Shift+Enter)
//   const handleKeyDown = (e) => {
//     if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
//       e.preventDefault();
//       if (!isLoading && !isEmailLoading && notificationMessage.trim()) {
//         sendNotification();
//       }
//     }
//   };

//   const handleToggleUser = (userId) => {
//     // Determine the current state and what it should be toggled to
//     const isCurrentlySelected = selectedUsers.includes(userId);
//     const toggled = !isCurrentlySelected;

//     console.log(`Admin toggling user ${userId}: ${toggled}`);

//     // Emit to server
//     if (socket) {
//       socket.emit("admin-toggle-user", { userId, toggled }, (response) => {
//         console.log("Server acknowledgment:", response);
//         // Optionally show a toast or log the result
//       });
//     }

//     // Update local state with localStorage persistence
//     setSelectedUsers((prev) => {
//       const updated = toggled
//         ? [...new Set([...prev, userId])]
//         : prev.filter((id) => id !== userId);

//       localStorage.setItem("multiSelectUsers", JSON.stringify(updated));
//       return updated;
//     });
//   };

//   // ==================== SOCKET INITIALIZATION ====================

//   useEffect(() => {
//     // Initialize socket connection
//     const newSocket = io(
//       // "http://localhost:5000",
//       `${process.env.REACT_APP_API_BASE_URL}`, 
//     {
//       withCredentials: true,
//     });

//     newSocket.on("connect", () => {
//       console.log("Admin connected to server", newSocket.id);
//     });

//     // Listen for user status updates
//     newSocket.on("user-status-update", (data) => {
//       console.log("User status update:", data);
//       updateUserAlert(data);
//     });

//     // Listen for admin alerts - store pending alerts if users not loaded
//     newSocket.on("admin-alert", (alertData) => {
//       console.log("Admin alert received:", alertData);
//       if (alertData.type === "user-inactive") {
//         console.log(alertData, "alertDataalertDataalertDataalertData");

//         // If users data is not loaded yet, store in pending alerts
//         if (!usersLoaded) {
//           setPendingAlerts((prev) => [...prev, alertData]);
//         } else {
//           addUserAlert(alertData);
//         }
//       }
//     });

//     newSocket.on("disconnect", () => {
//       console.log("Admin disconnected from server");
//     });

//     newSocket.on("connect_error", (error) => {
//       console.error("Socket connection error:", error);
//     });

//     setSocket(newSocket);
//     fetchUsers();

//     // Cleanup socket on unmount
//     return () => {
//       newSocket.close();
//     }
//   }, []);

//   // Effect to process pending alerts when users data is loaded
//   useEffect(() => {
//     if (usersLoaded && pendingAlerts.length > 0) {
//       console.log("Processing pending alerts:", pendingAlerts);
//       pendingAlerts.forEach((alertData) => {
//         addUserAlert(alertData);
//       });
//       setPendingAlerts([]);
//     }
//   }, [usersLoaded, pendingAlerts]);

//   // ==================== DATA PROCESSING EFFECTS ====================

//   // Effect to handle focus management for modal
//   useEffect(() => {
//     if (showMessageModal) {
//       // Use a longer timeout to ensure modal is fully rendered
//       const focusTimer = setTimeout(() => {
//         if (textareaRef.current) {
//           textareaRef.current.focus();
//           // Position cursor at end of text
//           textareaRef.current.setSelectionRange(
//             notificationMessage.length,
//             notificationMessage.length
//           );
//         }
//       }, 200);

//       return () => clearTimeout(focusTimer);
//     }
//   }, [showMessageModal, notificationMessage.length]);

//   // Effect to sort users with toggle priority
//   useEffect(() => {
//     // Sort users: toggled users first, then non-toggled users
//     const sortedUsers = [...users].sort((a, b) => {
//       const aToggled = selectedUsers.includes(a.id);
//       const bToggled = selectedUsers.includes(b.id);

//       // If both are toggled or both are not toggled, maintain original order
//       if (aToggled === bToggled) return 0;

//       // Toggled users come first
//       return bToggled - aToggled;
//     });

//     setFilterData(sortedUsers);
//   }, [users, selectedUsers]);

//   // Effect to handle search filtering with toggle priority
//   useEffect(() => {
//     // Apply search filter while maintaining toggle priority
//     let filtered = users;

//     if (searchTerm) {
//       filtered = users.filter((user) =>
//         user.name.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     // Sort filtered results: toggled users first
//     const sortedFiltered = [...filtered].sort((a, b) => {
//       const aToggled = selectedUsers.includes(a.id);
//       const bToggled = selectedUsers.includes(b.id);

//       // If both are toggled or both are not toggled, maintain original order
//       if (aToggled === bToggled) return 0;

//       // Toggled users come first
//       return bToggled - aToggled;
//     });

//     setFilterData(sortedFiltered);
//     setPage(0); // Reset to first page when search changes
//   }, [users, selectedUsers, searchTerm]);

//   // Effect to handle pagination
//   useEffect(() => {
//     const data = filterData.slice(
//       page * rowsPerPage,
//       page * rowsPerPage + rowsPerPage
//     );
//     setPaginatedData(data);
//   }, [filterData, page, rowsPerPage]);

//   // Effect to update notification userNames when users data is loaded
//   useEffect(() => {
//     if (usersLoaded && users && users.length > 0) {
//       setNotifications((prev) =>
//         prev.map((notification) => ({
//           ...notification,
//           userName:
//             notification.userName === "Loading..." ||
//             notification.userName === "Unknown User"
//               ? getUserNameById(notification.userId)
//               : notification.userName,
//         }))
//       );
//     }
//   }, [usersLoaded, users]);

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar />

//       <main className="flex-1 p-8 overflow-y-auto">
//         <div className="flex justify-between">
//           <h2 className="text-2xl font-bold mb-1">All Users Overview</h2>
//           {/* Notification Bell Icon */}
//           <IconButton
//             onClick={() => setShowNotificationModal(true)}
//             color="primary"
//             size="large"
//           >
//             <Badge badgeContent={unreadCount} color="error">
//               {unreadCount > 0 ? (
//                 <BellRing className="w-6 h-6" />
//               ) : (
//                 <Bell className="w-6 h-6" />
//               )}
//             </Badge>
//           </IconButton>
//         </div>
//         <p className="text-sm text-gray-600 mb-4 italic">
//           Search and manage all users with activity overview and notifications.
//         </p>

//         <hr className="border-t border-gray-300 mb-6" />

//         <div className="mb-4 flex gap-4 items-center">
//           <TextField
//             label="Search by name"
//             size="small"
//             variant="outlined"
//             value={searchTerm}
//             onChange={handleSearch}
//           />

//           <Autocomplete
//             multiple
//             options={users}
//             getOptionLabel={(option) => option.name}
//             value={users.filter((user) => selectedUsers.includes(user.id))}
//             onChange={(event, newValue) => {
//               const ids = newValue.map((user) => user.id);

//               const added = ids.filter((id) => !selectedUsers.includes(id));
//               const removed = selectedUsers.filter((id) => !ids.includes(id));

//               setSelectedUsers(ids);
//               localStorage.setItem("multiSelectUsers", JSON.stringify(ids));
//               // 🔌 Emit socket events for added/removed
//               if (socket) {
//                 added.forEach((id) =>
//                   socket.emit("admin-toggle-user", {
//                     userId: id,
//                     toggled: true,
//                   })
//                 );
//                 removed.forEach((id) =>
//                   socket.emit("admin-toggle-user", {
//                     userId: id,
//                     toggled: false,
//                   })
//                 );
//               }
//             }}
//             size="small"
//             renderInput={(params) => (
//               <TextField {...params} label="Select users to toggle" />
//             )}
//             sx={{
//               minWidth: 300,
//               maxWidth: 300,
//               // Prevent input from wrapping and expanding
//               "& .MuiAutocomplete-inputRoot": {
//                 flexWrap: "nowrap",
//                 maxWidth: "100%",
//                 overflow: "hidden",
//               },
//               // Control the input field height
//               "& .MuiAutocomplete-input": {
//                 minWidth: "30px !important", 
//               },
//               // Style the chips/tags
//               "& .MuiAutocomplete-tag": {
//                 maxWidth: 80,
//                 overflow: "hidden",
//                 textOverflow: "ellipsis",
//                 whiteSpace: "nowrap",
//               },
//               // Prevent height expansion
//               "& .MuiAutocomplete-inputRoot.MuiOutlinedInput-root": {
//                 minHeight: "40px", // Set fixed height for small size
//                 maxHeight: "40px", // Prevent expansion
//                 alignItems: "center",
//               },
//             }}
//             limitTags={3}
//             // Add this to show count when tags are limited
//             getLimitTagsText={(more) => `+${more} more`}
//           />
//         </div>

//         <TableContainer component={Paper}>
//           <Table aria-label="users table">
//             <TableHead>
//               <TableRow>
//                 <TableCell>
//                   <strong>Name</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Status</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Toggle</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Alerts</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Total Active Time</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Send Notification</strong>
//                 </TableCell>
//               </TableRow>
//             </TableHead>

//             <TableBody>
//               {paginatedData.length > 0 ? (
//                 paginatedData.map((user) => (
//                   <TableRow
//                     key={user.id}
//                     hover
//                     sx={{
//                       // Highlight toggled users
//                       backgroundColor: selectedUsers.includes(user.id)
//                         ? "rgba(25, 118, 210, 0.08)"
//                         : "inherit",
//                       "&:hover": {
//                         backgroundColor: selectedUsers.includes(user.id)
//                           ? "rgba(25, 118, 210, 0.12)"
//                           : "rgba(0, 0, 0, 0.04)",
//                       },
//                     }}
//                   >
//                     <TableCell>
//                       <Typography variant="body2" fontWeight="medium">
//                         {user.name}
//                         {/* {selectedUsers.includes(user.id) && (
//                           <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                             Toggled
//                           </span>
//                         )} */}
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="center">
//                       <span
//                         className={`inline-block w-2 h-2 rounded-full mr-1 ${
//                           user?.activeStatus ? "bg-green-500" : "bg-red-500"
//                         }`}
//                       ></span>
//                       <span className="text-xs text-gray-600">
//                         {user?.activeStatus ? "Online" : "Offline"}
//                       </span>
//                     </TableCell>
//                     <TableCell align="center">
//                       <Switch
//                         checked={selectedUsers.includes(user.id)}
//                         onChange={() => handleToggleUser(user.id)}
//                         color="primary"
//                       />
//                     </TableCell>
//                     <TableCell align="center">
//                       {userAlerts[user.id] ? (
//                         <Tooltip title={userAlerts[user.id].message}>
//                             <Chip
//                               icon={getAlertIcon(userAlerts[user.id].severity)}
//                               label={userAlerts[user.id].count}
//                               color={getAlertColor(userAlerts[user.id].severity)}
//                               size="small"
//                               variant="outlined"
//                               onClick={(e) => e.preventDefault()}
//                             />
//                         </Tooltip>
//                       ) : (
//                         <span className="text-xs text-gray-400">-</span>
//                       )}
//                     </TableCell>
//                     <TableCell align="center">
//                       <Typography variant="body2">
//                         {user.totalActiveHours || "-"}
//                       </Typography>
//                     </TableCell>
//                     <TableCell align="center">
//                       <Button
//                         variant="outlined"
//                         size="small"
//                         startIcon={<Send className="w-4 h-4" />}
//                         onClick={() => handleNotifyClick(user)}
//                         disabled={isLoading}
//                         sx={{
//                           textTransform: "none",
//                           fontSize: "0.875rem",
//                         }}
//                       >
//                         Notify
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={5} align="center">
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       fontStyle="italic"
//                     >
//                       No users found.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>

//           <TablePagination
//             component="div"
//             count={filterData.length}
//             page={page}
//             onPageChange={handleChangePage}
//             rowsPerPage={rowsPerPage}
//             onRowsPerPageChange={handleChangeRowsPerPage}
//             rowsPerPageOptions={[5, 10, 25]}
//           />
//         </TableContainer>
//       </main>

//       {/* Notification Modal */}
//       <Dialog
//         open={showNotificationModal}
//         onClose={() => setShowNotificationModal(false)}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Box display="flex" alignItems="center" gap={1}>
//               <Bell className="w-5 h-5" />
//               <Typography variant="h6">System Notifications</Typography>
//               {unreadCount > 0 && (
//                 <Badge badgeContent={unreadCount} color="error" />
//               )}
//             </Box>
//             <Box>
//               <Button
//                 size="small"
//                 onClick={clearAllNotifications}
//                 disabled={notifications.length === 0}
//                 sx={{ mr: 1 }}
//               >
//                 Clear All
//               </Button>
//               <IconButton onClick={() => setShowNotificationModal(false)}>
//                 <X className="w-5 h-5" />
//               </IconButton>
//             </Box>
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           {notifications.length === 0 ? (
//             <Box textAlign="center" py={4}>
//               <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
//               <Typography variant="body1" color="text.secondary">
//                 No notifications yet
//               </Typography>
//             </Box>
//           ) : (
//             <List>
//               {notifications.map((notification, index) => (
//                 <div key={notification.id}>
//                   <ListItem
//                     sx={{
//                       backgroundColor: notification.read
//                         ? "transparent"
//                         : "rgba(25, 118, 210, 0.08)",
//                       borderRadius: 1,
//                       mb: 1,
//                     }}
//                   >
//                     <ListItemIcon>
//                       {getAlertIcon(notification.severity)}
//                     </ListItemIcon>
//                     <ListItemText
//                       primary={
//                         <Box
//                           display="flex"
//                           justifyContent="space-between"
//                           alignItems="center"
//                         >
//                           <Typography variant="subtitle2">
//                             {notification.userName} - {notification.type}
//                           </Typography>
//                           <Typography variant="caption" color="text.secondary">
//                             {formatTimestamp(notification.timestamp)}
//                           </Typography>
//                         </Box>
//                       }
//                       secondary={notification.message}
//                     />
//                     {!notification.read && (
//                       <IconButton
//                         size="small"
//                         onClick={() => markAsRead(notification.id)}
//                         sx={{ ml: 1 }}
//                       >
//                         <X className="w-4 h-4" />
//                       </IconButton>
//                     )}
//                   </ListItem>
//                   {index < notifications.length - 1 && <Divider />}
//                 </div>
//               ))}
//             </List>
//           )}
//         </DialogContent>
//       </Dialog>
//       {/* Enhanced Material-UI Modal */}
//       <Dialog
//         open={showMessageModal}
//         onClose={handleCloseModal}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: 2,
//             minHeight: "400px",
//           },
//         }}
//         // Prevent closing when clicking outside if loading
//         disableEscapeKeyDown={isLoading || isEmailLoading}
//         onBackdropClick={
//           isLoading || isEmailLoading ? undefined : handleCloseModal
//         }
//       >
//         <DialogTitle sx={{ pb: 1 }}>
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Box>
//               <Typography variant="h6" component="div">
//                 Send Notification
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 To: {selectedUser?.name}
//               </Typography>
//             </Box>
//             <Button
//               onClick={handleCloseModal}
//               disabled={isLoading || isEmailLoading}
//               sx={{ minWidth: "auto", p: 0.5 }}
//             >
//               <X className="w-5 h-5" />
//             </Button>
//           </Box>
//         </DialogTitle>

//         <DialogContent sx={{ pt: 2 }}>
//           {/* Status indicator */}
//           <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
//             <Box display="flex" alignItems="center" gap={1}>
//               <Box
//                 width={8}
//                 height={8}
//                 borderRadius="50%"
//                 bgcolor={
//                   selectedUser?.activeStatus ? "success.main" : "error.main"
//                 }
//               />
//               <Typography variant="body2" color="text.secondary">
//                 Status:
//                 <Typography
//                   component="span"
//                   color={
//                     selectedUser?.activeStatus ? "success.main" : "error.main"
//                   }
//                   fontWeight="medium"
//                   ml={0.5}
//                 >
//                   {selectedUser?.activeStatus ? "Online" : "Offline"}
//                 </Typography>
//               </Typography>
//             </Box>
//           </Box>

//           {/* Message input */}
//           <TextField
//             inputRef={textareaRef}
//             label="Message"
//             multiline
//             rows={4}
//             fullWidth
//             variant="outlined"
//             value={notificationMessage}
//             onChange={handleMessageChange}
//             onKeyDown={handleKeyDown}
//             placeholder="Enter your message... (Ctrl+Enter to send)"
//             disabled={isLoading || isEmailLoading}
//             inputProps={{
//               maxLength: 500,
//               style: { resize: "vertical" },
//             }}
//             helperText={`${notificationMessage.length}/500 characters`}
//             sx={{ mb: 2 }}
//             autoFocus
//           />

//           {/* Status message */}
//           {sendStatus && (
//             <Alert
//               severity={sendStatus === "success" ? "success" : "error"}
//               sx={{ mb: 2 }}
//               icon={getStatusIcon()}
//             >
//               {getStatusMessage()}
//             </Alert>
//           )}

//           {/* Delivery info */}
//           <Box p={2} bgcolor="info.50" borderRadius={1}>
//             <Typography variant="body2" color="text.secondary">
//               {selectedUser?.activeStatus ? (
//                 <>
//                   📱 User is online - notification will be delivered immediately
//                 </>
//               ) : (
//                 <>
//                   📤 User is offline - notification will be queued and delivered
//                   when they come online
//                 </>
//               )}
//             </Typography>
//           </Box>
//         </DialogContent>

//         <DialogActions sx={{ p: 3, pt: 1 }}>
//           <Button
//             onClick={handleCloseModal}
//             disabled={isLoading || isEmailLoading}
//             variant="outlined"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={sendNotification}
//             disabled={
//               isLoading ||
//               isEmailLoading ||
//               !notificationMessage.trim() ||
//               sendStatus === "success"
//             }
//             variant="contained"
//             startIcon={
//               isLoading ? (
//                 <CircularProgress size={16} color="inherit" />
//               ) : (
//                 <Send className="w-4 h-4" />
//               )
//             }
//           >
//             {isLoading ? "Sending..." : "Send Message"}
//           </Button>
//           <Button
//             onClick={handleSendEmail}
//             disabled={isLoading || isEmailLoading || selectedUser?.activeStatus}
//             variant="outlined"
//             color="secondary"
//             sx={{ ml: "auto" }}
//             startIcon={
//               isEmailLoading ? (
//                 <CircularProgress size={16} color="inherit" />
//               ) : undefined
//             }
//           >
//             {isEmailLoading ? "Sending Email..." : "Send Email"}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default UsersAll;