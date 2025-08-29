import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Charts = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [topApps, setTopApps] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [weekLabels, setWeekLabels] = useState([]);
  const [barColors, setBarColors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(15);
  useEffect(() => {
    fetchUsers();
    fetchActivityLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/getAllUsersCount`,
        // "http://localhost:5000/api/users/getAllUsersCount",
        {
          withCredentials: true,
        }
      );
      setTotalUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/activities/all-activity`,
        { withCredentials: true }
      );

      const logs = res.data.data.logs;
      console.log(logs, "logs in activity for backend");
      const appCount = {};
      const dailyUsage = Array(7).fill(0);

      const today = dayjs();
      const todayIndex = today.day() === 0 ? 6 : today.day() - 1;

      const colors = Array(7).fill("#3B82F6");
      colors[todayIndex] = "#10B981";
      setBarColors(colors);

      const startOfWeek = today.startOf("week").add(1, "day");
      const endOfWeek = startOfWeek.add(6, "day");

      const newWeekLabels = Array.from({ length: 7 }, (_, i) =>
        startOfWeek.add(i, "day").format("DD MMM")
      );
      setWeekLabels(newWeekLabels);

      logs.forEach((log) => {
        const logDate = dayjs(log.timestamp || log.createdAt);
        if (logDate.isBefore(startOfWeek) || logDate.isAfter(endOfWeek)) return;

        const app = log.appName || "Unknown";
        appCount[app] = (appCount[app] || 0) + 1;

        const day = logDate.day() === 0 ? 6 : logDate.day() - 1;
        dailyUsage[day] += 10 / 60; // 10 minutes = 10/60 hours
      });

      const sortedApps = Object.entries(appCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setTopApps(sortedApps);
      setWeeklyActivity(dailyUsage);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
  };

  const chartData = {
    labels: weekLabels,
    datasets: [
      {
        label: "Time Spent",
        data: weeklyActivity,
        backgroundColor: barColors,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return value < 1
              ? `${Math.round(value * 60)} min`
              : `${value.toFixed(1)} hr`;
          },
          color: "#4B5563",
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.raw;
            return val < 1
              ? `${Math.round(val * 60)} minutes`
              : `${val.toFixed(1)} hours`;
          },
        },
      },
    },
  };

  const handleDeleteOldLogs = async () => {
    try {
      const res = await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/activities/old-logs?days=${selectedDays}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        alert(`Deleted ${res.data.deletedCount} old activity logs.`);
        fetchActivityLogs();
      } else {
        alert("Failed to delete old logs.");
      }
    } catch (err) {
      console.error("Error deleting old logs:", err);
      alert("An error occurred while deleting old logs.");
    } finally {
      setShowModal(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            className="mb-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete Older Logs
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-lg font-medium text-gray-600">Total Users</h2>
            <p className="text-3xl font-semibold text-blue-600">{totalUsers}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow col-span-2">
            <h2 className="text-lg font-medium text-gray-600 mb-4">
              Weekly Activity (Mon - Sun)
            </h2>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-medium text-gray-600 mb-4">
            Top Used Apps
          </h2>
          <ul className="space-y-2">
            {topApps.map(([app, count], index) => (
              <li key={index} className="flex justify-between border-b pb-2">
                <span>{app}</span>
                <span>{count} times</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96">
            <h2 className="text-lg font-semibold mb-4">Delete Logs</h2>
            <label className="block mb-2 text-sm font-medium">
              Keep logs from last:
            </label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="w-full p-2 border rounded mb-4"
            >
              <option value={7}>7 days</option>
              <option value={10}>10 days</option>
              <option value={15}>15 days</option>
              <option value={20}>20 days</option>
            </select>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOldLogs}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;