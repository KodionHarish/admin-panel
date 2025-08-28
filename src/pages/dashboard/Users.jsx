// Users.jsx - Updated with Redux notifications
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import { addNotification, markAsRead, markAllAsRead, clearAllNotifications, clearUserAlert } from "../../features/notificationSlice";
import Sidebar from "../../components/Sidebar";
import UserTable from "../../components/UserList/UserTable";
import NotificationModal from "../../components/UserList/NotificationModal";
import SendMessageModal from "../../components/UserList/SendMessageModal";
import NotificationBell from "../../components/UserList/NotificationBell";
import SearchAndFilters from "../../components/UserList/SearchAndFilters";

const UsersAll = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, userAlerts } = useSelector(state => state.notifications);

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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState([]);

  // User selection state with localStorage persistence
  const [selectedUsers, setSelectedUsers] = useState(() => {
    const stored = localStorage.getItem("multiSelectUsers");
    return stored ? JSON.parse(stored) : [];
  });
  const textareaRef = useRef(null);

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

  const getUserNameById = (userId) => {
    if (!usersLoaded || !users?.length) {
      return "Loading...";
    }
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const addUserAlert = (alertData) => {
    const notificationData = {
      ...alertData,
      userName: alertData.userName || getUserNameById(alertData.userId),
    };

    dispatch(addNotification(notificationData));

    // Desktop notification
    if (Notification.permission === "granted") {
      const notif = new Notification(`⚠️ ${notificationData.userName || "User Alert"}`, {
        body: notificationData.message
      });

      notif.onclick = () => {
        window.focus();
        setShowNotificationModal(true);
        dispatch(markAsRead(notificationData.id));
      }
    }
  };

  const updateUserAlert = (data) => {
    if (data.isOnline && data.isTracking) {
      dispatch(clearUserAlert(data.userId));
    }
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
      console.error("Error fetching users:", err.response?.data || err.message);
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
        const timeout = setTimeout(() => reject(new Error("Request timeout")), 10000);

        socket.emit("notify-user", {
          userId: selectedUser.id,
          name: selectedUser.name,
          message: notificationMessage.trim(),
        }, (response) => {
          clearTimeout(timeout);
          if (response && response.success !== false) {
            resolve(response);
          } else {
            reject(new Error(response?.message || "Failed to send notification"));
          }
        });
      });

      await sendPromise;
      setSendStatus("success");
      setTimeout(() => handleCloseModal(), 1500);
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
        setTimeout(() => handleCloseModal(), 1500);
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
  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleChangePage = (event, newPage) => setPage(newPage);
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

  const handleMessageChange = (e) => setNotificationMessage(e.target.value);

  const handleToggleUser = (userId) => {
    const isCurrentlySelected = selectedUsers.includes(userId);
    const toggled = !isCurrentlySelected;

    if (socket) {
      socket.emit("admin-toggle-user", { userId, toggled }, (response) => {
        console.log("Server acknowledgment:", response);
      });
    }

    setSelectedUsers(prev => {
      const updated = toggled
        ? [...new Set([...prev, userId])]
        : prev.filter(id => id !== userId);

      localStorage.setItem("multiSelectUsers", JSON.stringify(updated));
      return updated;
    });
  };

  const handleMultiSelectChange = (newValue) => {
    const ids = newValue.map(user => user.id);
    const added = ids.filter(id => !selectedUsers.includes(id));
    const removed = selectedUsers.filter(id => !ids.includes(id));

    setSelectedUsers(ids);
    localStorage.setItem("multiSelectUsers", JSON.stringify(ids));

    if (socket) {
      added.forEach(id => socket.emit("admin-toggle-user", { userId: id, toggled: true }));
      removed.forEach(id => socket.emit("admin-toggle-user", { userId: id, toggled: false }));
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
      
      // Update the user list status in real-time
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === data.userId ? { ...user, activeStatus: data.isOnline } : user
        )
      );
    });

    newSocket.on("admin-alert", (alertData) => {
      console.log("Admin alert received:", alertData);
      if (alertData.type === "user-inactive") {
        if (!usersLoaded) {
          setPendingAlerts(prev => [...prev, alertData]);
        } else {
          addUserAlert(alertData);
        }
      }
    });

    setSocket(newSocket);
    fetchUsers();

    return () => newSocket.close();
  }, []);

  // Process pending alerts when users data is loaded
  useEffect(() => {
    if (usersLoaded && pendingAlerts.length > 0) {
      pendingAlerts.forEach(alertData => addUserAlert(alertData));
      setPendingAlerts([]);
    }
  }, [usersLoaded, pendingAlerts]);

  // ==================== DATA PROCESSING EFFECTS ====================
  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sortedFiltered = [...filtered].sort((a, b) => {
      const aToggled = selectedUsers.includes(a.id);
      const bToggled = selectedUsers.includes(b.id);
      return bToggled - aToggled;
    });

    setFilterData(sortedFiltered);
    setPage(0);
  }, [users, selectedUsers, searchTerm]);

  useEffect(() => {
    const data = filterData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    setPaginatedData(data);
  }, [filterData, page, rowsPerPage]);

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
        onMarkAsRead={(id) => dispatch(markAsRead(id))}
        onClearAll={() => dispatch(clearAllNotifications())}
        onMarkAllAsRead={() => dispatch(markAllAsRead())}
      />

      <SendMessageModal
        open={showMessageModal}
        textareaRef={textareaRef}
        onClose={handleCloseModal}
        selectedUser={selectedUser}
        notificationMessage={notificationMessage}
        onMessageChange={handleMessageChange}
        onSendNotification={sendNotification}
        onSendEmail={handleSendEmail}
        isLoading={isLoading}
        isEmailLoading={isEmailLoading}
        sendStatus={sendStatus}
      />
    </div>
  );
};

export default UsersAll;


// // Users.jsx - Main component with business logic
// import { useState, useEffect ,useRef} from "react";
// import axios from "axios";
// import { io } from "socket.io-client";
// import Sidebar from "../../components/Sidebar";
// import UserTable from "../../components/UserList/UserTable";
// import NotificationModal from "../../components/UserList/NotificationModal";
// import SendMessageModal from "../../components/UserList/SendMessageModal";
// import NotificationBell from "../../components/UserList/NotificationBell";
// import SearchAndFilters from "../../components/UserList/SearchAndFilters";

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
//   const textareaRef = useRef(null);
//   // Notification system state
//   const [notifications, setNotifications] = useState([]);
//   const [showNotificationModal, setShowNotificationModal] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [userAlerts, setUserAlerts] = useState({});
//   const [pendingAlerts, setPendingAlerts] = useState([]);

//   // ==================== NOTIFICATION FUNCTIONS ====================
//   useEffect(() => {
//     if(Notification.permission !== "granted"){
//       Notification.requestPermission().then((permission) => {
//         if(permission !== "granted"){
//           console.log("Desktop notifications not granted");
//         }
//       })
//     }
//   },[])

//   // Helper function to get user name by ID
//   const getUserNameById = (userId) => {
//     if (!usersLoaded || !users || users.length === 0) {
//       console.warn("Users data not loaded yet");
//       return "Loading...";
//     }
//     const user = users.find((u) => u.id === userId);
//     return user ? user.name : "Unknown User";
//   };

//   // Function to add new alert to notifications
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
//     if (data.isOnline && data.isTracking) {
//       setUserAlerts((prev) => {
//         const updated = { ...prev };
//         delete updated[userId];
//         return updated;
//       });

//       // setNotifications((prev) =>
//       //   prev.filter((notif) => notif.userId !== userId)
//       // );
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

//   // Function to mark all notifications as read
//   const markAllAsRead = () => {
//     setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
//     setUnreadCount(0);
//     setUserAlerts({});
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
//         `${process.env.REACT_APP_API_BASE_URL}/api/users/usersLogs`,
//         { withCredentials: true }
//       );
//       console.log(res, "res");
//       setUsers(res.data.data || []);
//       setUsersLoaded(true);
//     } catch (err) {
//       console.error("Error fetching users:", err.response?.data || err.message);
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
//       const sendPromise = new Promise((resolve, reject) => {
//         const timeout = setTimeout(() => {
//           reject(new Error("Request timeout"));
//         }, 10000);

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

//       await sendPromise;
//       setSendStatus("success");

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
//         `${process.env.REACT_APP_API_BASE_URL}/api/notify/force-email`,
//         {
//           userId: selectedUser.id,
//           message: notificationMessage.trim(),
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
//     setSearchTerm(e.target.value);
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
 
//   const handleMessageChange = (e) => {
//     setNotificationMessage(e.target.value);
//   };
  
//   const handleToggleUser = (userId) => {
//     const isCurrentlySelected = selectedUsers.includes(userId);
//     const toggled = !isCurrentlySelected;

//     if (socket) {
//       socket.emit("admin-toggle-user", { userId, toggled }, (response) => {
//         console.log("Server acknowledgment:", response);
//       });
//     }

//     setSelectedUsers((prev) => {
//       const updated = toggled
//         ? [...new Set([...prev, userId])]
//         : prev.filter((id) => id !== userId);

//       localStorage.setItem("multiSelectUsers", JSON.stringify(updated));
//       return updated;
//     });
//   };

//   const handleMultiSelectChange = (newValue) => {
//     const ids = newValue.map((user) => user.id);
//     const added = ids.filter((id) => !selectedUsers.includes(id));
//     const removed = selectedUsers.filter((id) => !ids.includes(id));

//     setSelectedUsers(ids);
//     localStorage.setItem("multiSelectUsers", JSON.stringify(ids));

//     if (socket) {
//       added.forEach((id) =>
//         socket.emit("admin-toggle-user", { userId: id, toggled: true })
//       );
//       removed.forEach((id) =>
//         socket.emit("admin-toggle-user", { userId: id, toggled: false })
//       );
//     }
//   };

//   // ==================== SOCKET INITIALIZATION ====================
//   useEffect(() => {
//     const newSocket = io(`${process.env.REACT_APP_API_BASE_URL}`, {
//       withCredentials: true,
//     });

//     newSocket.on("connect", () => {
//       console.log("Admin connected to server", newSocket.id);
//     });

//     newSocket.on("user-status-update", (data) => {
//       console.log("User status update:", data);
//       updateUserAlert(data);
//     });

//     newSocket.on("admin-alert", (alertData) => {
//       console.log("Admin alert received:", alertData);
//       if (alertData.type === "user-inactive") {
//         if (!usersLoaded) {
//           setPendingAlerts((prev) => [...prev, alertData]);
//         } else {
//           addUserAlert(alertData);
//         }
//       }
//     });

//     newSocket.on("user-status-update", ({ userId, isOnline }) => {
//       console.log("User status update:", { userId, isOnline });

//       // Update the user list status in real-time
//       setUsers((prevUsers) =>
//         prevUsers.map((user) =>
//           user.id === userId ? { ...user, activeStatus: isOnline } : user
//         )
//       );
//     });
    
//     newSocket.on("disconnect", () => {
//       console.log("Admin disconnected from server");
//     });

//     newSocket.on("connect_error", (error) => {
//       console.error("Socket connection error:", error);
//     });

//     setSocket(newSocket);
//     fetchUsers();

//     return () => {
//       newSocket.close();
//     }
//   }, []);
//   // Effect to process pending alerts when users data is loaded
//   useEffect(() => {
//     if (usersLoaded && pendingAlerts.length > 0) {
//       pendingAlerts.forEach((alertData) => {
//         addUserAlert(alertData);
//       });
//       setPendingAlerts([]);
//     }
//   }, [usersLoaded, pendingAlerts]);

//   // ==================== DATA PROCESSING EFFECTS ====================
//   useEffect(() => {
//     const sortedUsers = [...users].sort((a, b) => {
//       const aToggled = selectedUsers.includes(a.id);
//       const bToggled = selectedUsers.includes(b.id);
//       if (aToggled === bToggled) return 0;
//       return bToggled - aToggled;
//     });
//     setFilterData(sortedUsers);
//   }, [users, selectedUsers]);

//   useEffect(() => {
//     let filtered = users;
//     if (searchTerm) {
//       filtered = users.filter((user) =>
//         user.name.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     const sortedFiltered = [...filtered].sort((a, b) => {
//       const aToggled = selectedUsers.includes(a.id);
//       const bToggled = selectedUsers.includes(b.id);
//       if (aToggled === bToggled) return 0;
//       return bToggled - aToggled;
//     });

//     setFilterData(sortedFiltered);
//     setPage(0);
//   }, [users, selectedUsers, searchTerm]);

//   useEffect(() => {
//     const data = filterData.slice(
//       page * rowsPerPage,
//       page * rowsPerPage + rowsPerPage
//     );
//     setPaginatedData(data);
//   }, [filterData, page, rowsPerPage]);

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
//           <NotificationBell 
//             unreadCount={unreadCount}
//             onClick={() => setShowNotificationModal(true)}
//           />
//         </div>
//         <p className="text-sm text-gray-600 mb-4 italic">
//           Search and manage all users with activity overview and notifications.
//         </p>

//         <hr className="border-t border-gray-300 mb-6" />

//         <SearchAndFilters
//           searchTerm={searchTerm}
//           onSearchChange={handleSearch}
//           users={users}
//           selectedUsers={selectedUsers}
//           onMultiSelectChange={handleMultiSelectChange}
//         />

//         <UserTable
//           paginatedData={paginatedData}
//           selectedUsers={selectedUsers}
//           userAlerts={userAlerts}
//           onToggleUser={handleToggleUser}
//           onNotifyClick={handleNotifyClick}
//           isLoading={isLoading}
//           filterData={filterData}
//           page={page}
//           rowsPerPage={rowsPerPage}
//           onChangePage={handleChangePage}
//           onChangeRowsPerPage={handleChangeRowsPerPage}
//         />
//       </main>

//       <NotificationModal
//         open={showNotificationModal}
//         onClose={() => setShowNotificationModal(false)}
//         notifications={notifications}
//         unreadCount={unreadCount}
//         onMarkAsRead={markAsRead}
//         onClearAll={clearAllNotifications}
//         onMarkAllAsRead={markAllAsRead}
//       />

//       <SendMessageModal
//         open={showMessageModal}
//         textareaRef={textareaRef}
//         onClose={handleCloseModal}
//         selectedUser={selectedUser}
//         notificationMessage={notificationMessage}
//         onMessageChange={handleMessageChange}
//         onSendNotification={sendNotification}
//         onSendEmail={handleSendEmail}
//         isLoading={isLoading}
//         isEmailLoading={isEmailLoading}
//         sendStatus={sendStatus}
//       />
//     </div>
//   );
// };

// export default UsersAll;