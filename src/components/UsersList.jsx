// MAIN COMPONENT: Users.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import UserSummary from "./Users/UserSummary";
import TimelineView from "./Users/TimelineView";
import { io } from "socket.io-client";
 
export default function UsersList({ viewMode, setViewMode }) {
  const [userWithLogs, setUserWithLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState({});
  const [fetchLatestData, setFetchLatestData] = useState(false);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [socket, setSocket] = useState(null);

  // Initialize socket connection with proper cleanup
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_BASE_URL, {
      query: {
        userType: 'admin'
      },
      withCredentials: true,
    });

   

    // Handle status updates
    newSocket.on("user-status-update", ({ userId, isOnline }) => {
      console.log(`Dashboard received status update: User ${userId} is ${isOnline ? 'online' : 'offline'}`);
      setUserWithLogs((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, activeStatus: isOnline } : user
        )
      );
    });
    //  setSocket(newSocket);
    return () => {
      console.log("Dashboard disconnecting socket");
      newSocket.disconnect();
    };
  }, []);


  useEffect(() => {
    const fetchData = () => {
      axios
        .get(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/usersWithLogs?date=${date}`,
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          // const processedUsers = res.data.data.map((user) => ({
          //   ...user,
          //   activity_data:
          //     typeof user.activity_data === "string"
          //       ? JSON.parse(user.activity_data || "[]")
          //       : user.activity_data || [],
          // }));
          
          // setUserWithLogs(processedUsers);
          setUserWithLogs((prevUsers) => {
            const processedUsers = res.data.data.map((user) => {
              const prevUser = prevUsers.find((u) => u.id === user.id);
              return {
                ...user,
                activity_data:
                  typeof user.activity_data === "string"
                    ? JSON.parse(user.activity_data || "[]")
                    : user.activity_data || [],
                // keep activeStatus if we already have it
                activeStatus: prevUser ? prevUser.activeStatus : user.activeStatus ?? false,
              };
            });
            return processedUsers;
          });
        })
        .catch((err) => console.error("Failed to fetch users:", err));
    };
    fetchData();
    console.log(userWithLogs ,"processedUsers userWithLogs")
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [date, fetchLatestData]);
 
  const fetchUserLogs = (id) => {
    const sUser = userWithLogs.filter((user) => user.id == id);
    setSelectedUser(sUser[0]);
    setViewMode("timeline");
  };
 
  const handleBackToSummary = () => {
    setViewMode("summary");
  };
 
  const handleDateChange = (newDate) => {
    setDate(newDate);
    setViewMode("summary");
  };
 
 
  if (viewMode === "timeline") {
    return (
      <TimelineView
        selectedUser={selectedUser}
        date={date}
        fetchLatestData={fetchLatestData}
        setFetchLatestData={setFetchLatestData}
        onBack={handleBackToSummary}
      />
    );
  }
 
  return (
    <UserSummary
      userWithLogs={userWithLogs}
      date={date}
      onDateChange={handleDateChange}
      onUserClick={fetchUserLogs}
    />
  ); 
}