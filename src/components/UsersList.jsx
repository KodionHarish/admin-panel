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
  const socket = io(process.env.REACT_APP_API_BASE_URL);
 
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
          const processedUsers = res.data.data.map((user) => ({
            ...user,
            activity_data:
              typeof user.activity_data === "string"
                ? JSON.parse(user.activity_data || "[]")
                : user.activity_data || [],
          }));
          
          setUserWithLogs(processedUsers);
        })
        .catch((err) => console.error("Failed to fetch users:", err));
    };
    fetchData();
    console.log(userWithLogs ,"processedUsers userWithLogs")
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [date, fetchLatestData]);
 
  socket.on("status-updated", ({ userId, isOnline }) => {
    setUserWithLogs((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, activeStatus: isOnline } : user
      )
    );
  });
 
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