// UserSummary Component (Fixed)
import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Camera } from "lucide-react";
import { TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import TablePagination from "@mui/material/TablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import dayjs from "dayjs";


export default function UserSummary({
  userWithLogs,
  date,
  onDateChange,
  onUserClick,
}) {
  const [filterData, setFilterData] = useState([]);
  const [paginatedData, setPaginationData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    setFilterData(userWithLogs);
  }, [userWithLogs]);
  useEffect(() => {
    const paginatedData = filterData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
    setPaginationData(paginatedData);
  }, [filterData, page, rowsPerPage]);
  // console.log(filterData,"filterData")
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchUser = (e) => {
    setSearchTerm(e.target.value);
    const searchValue = e.target.value;
    const filtered = userWithLogs.filter((user) =>
      user.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilterData(filtered);
    setPage(0);
  };

  
  const computeActivityLevel = (user) => {
    const logs = user.activity_data || [];
    console.log(logs,"logs")
    if (logs.length === 0) return 0;
    
    // Calculate total metrics
    const totalKeyboard = logs.reduce((sum, log) => sum + (log.keyboardCount || 0), 0);
    const totalMouse = logs.reduce((sum, log) => sum + (log.mouseCount || 0), 0);
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 600), 0);
    console.log(totalDuration,"totalDuration")
    // if (totalDuration === 0) return 0;
    
    // Calculate activity per minute for the entire slot
    const durationInMinutes = totalDuration / 60;
    const kbPerMin = totalKeyboard / durationInMinutes;
    const mousePerMin = totalMouse / durationInMinutes;
    
    // Weighted score
    const weightedScore = kbPerMin * 1.5 + mousePerMin * 2.0;
    
    // Max possible score per minute
    const maxPossiblePerMin = (60 * 1.5 + 40 * 2.0);
    
    // Calculate activity level out of 10
    const activityLevel = Math.min(10, Math.round((weightedScore / maxPossiblePerMin) * 10));
    
    return Math.max(0, activityLevel);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">User Activity Overview</h2>
      <p className="text-sm text-gray-600 mb-4 italic">
        Track daily activity logs and performance summaries for each team
        member.
      </p>

      <hr className="border-t border-gray-300 mb-6" />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-semibold mb-1 sm:mb-0">
            Screenshot Summary
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={new Date(date)}
              slotProps={{ textField: { size: "small" } }}
              onChange={(newDate) =>
                onDateChange(newDate?.toISOString().split("T")[0])
              }
              maxDate={new Date()}
              renderInput={(params) => (
                <TextField {...params} variant="filled" />
              )}
            />
          </LocalizationProvider>
          <TextField
            label="Search by name"
            size="small"
            varient="filled"
            value={searchTerm}
            onChange={handleSearchUser}
          />
        </div>
      </div>

      <TableContainer component={Paper}>
        <Table aria-label="user activity table">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Screenshots</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Last Screenshot</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Status</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Active Time</strong>
              </TableCell>
               <TableCell align="center">
                <strong>Activity Level</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((user) => {
                let colorClass = "";

                if (user.statusColor === "red") {
                  colorClass = "text-red-500";
                } else if (user.statusColor === "yellow") {
                  colorClass = "text-yellow-700";
                } else {
                  colorClass = "text-green-700";
                }

                const activityLevels = computeActivityLevel(user);

                return (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => onUserClick(user.id)}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Camera className="w-4 h-4" />
                        {user.totalLength}
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      {dayjs(user.lastScreenshotTime).format("h:mm A")}
                      {/* {user.lastScreenshotTime || "-"} */}
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
                      {user.totalActiveHours === "0 min" ? (
                        "-"
                      ) : (
                        <span className={`${colorClass} font-semibold`}>
                          {user.totalActiveHours}
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <span className="text-sm font-semibold text-blue-600">
                        {activityLevels} / 10
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" style={{ height: 240 }}>
                    <span className="text-gray-500 italic">
                      No user found with data on this day
                    </span>
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filterData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>
    </div>
  );
}