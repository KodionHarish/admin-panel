import React, { useState, useEffect } from "react";
import TimelineHeader from "./TimelineHeader";
import TotalSummary from "./TotalSummary";
import TimeSlot from "./TimeSlot";
import axios from "axios";
import ActivityModal from "./ActivityModal";
import { groupLogsByTimeSlots } from "../../utils/timeUtils";
 
export default function TimelineView({
  selectedUser,
  date,
  fetchLatestData,
  setFetchLatestData,
  onBack
}) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState({});
  const [activityLogs, setActivityLogs] = useState(selectedUser.activity_data);
  const [activeTime, setActiveTime] = useState("");
  const timeSlots = groupLogsByTimeSlots(activityLogs);
  const [currentIndex, setCurrentIndex] = useState(0);
 
  useEffect(() => {
    if (selectedActivity?.id) {
      const index = activityLogs.findIndex(
        (item) => item.id === selectedActivity.id
      );
 
      if (index !== -1) setCurrentIndex(index);
    }
 
    activeTimeHandler(activityLogs.length || 0);
  }, [selectedActivity, activityLogs]);
 
  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedActivity(activityLogs[newIndex]);
    }
  };
 
  const handleNext = () => {
    if (currentIndex < activityLogs.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedActivity(activityLogs[newIndex]);
    }
  };
  const activeTimeHandler = (screenshotLength) => {
    const totalActiveMinutes = screenshotLength * 10;
    let formattedActiveTime = "";
    if (totalActiveMinutes < 60) {
      formattedActiveTime = `${totalActiveMinutes} min`;
    } else {
      const hours = Math.floor(totalActiveMinutes / 60);
      const minutes = totalActiveMinutes % 60;
      formattedActiveTime =
        minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
    }
    setActiveTime(formattedActiveTime);
  };
 
  const handleActivityClick = (activity) => {
    const index = activityLogs.findIndex((log) => log.id === activity.id);
    setCurrentIndex(index);
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };
 
  const deleteScreenShot = async (id) => {
    const res = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/activities/delete-screenshot/${selectedUser.id}/${id}`,
      {
        withCredentials: true,
      }
    );
    if (res.status === 200) {
      const updatedLogs = activityLogs.filter((log) => log.id !== id);
      setActivityLogs(updatedLogs);
      setShowDetailModal(false);
      setFetchLatestData(!fetchLatestData);
    }
  };
 
  let colorClass = "";
 
  if (selectedUser.statusColor == "red") {
    colorClass = "text-red-500";
  } else if (selectedUser.statusColor == "yellow") {
    colorClass = "text-yellow-700";
  } else {
    colorClass = "text-green-700";
  }
 
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <TimelineHeader date={date} onBack={onBack} />
 
      <TotalSummary totalDuration={activeTime} colorClass={colorClass} />
 
      <div className="space-y-8">
        {timeSlots.map((slot, index) => (
          <TimeSlot
            key={index}
            slot={slot}
            selectedUser={{ ...selectedUser, activity_data: activityLogs }}
            onScreenshotClick={handleActivityClick}
          />
        ))}
      </div>
 
      {showDetailModal && selectedActivity && (
        <ActivityModal
          activityLogs={activityLogs}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          activity={selectedActivity}
          currentIndex={currentIndex}
          handlePrev={handlePrev}
          handleNext={handleNext}
          deleteScreenShot={deleteScreenShot}
        />
      )}
    </div>
  );
}