// COMPONENT: TimeSlot.js
import React from "react";
import dayjs from "dayjs";

function getBarColor(index, level) {
  if (index < level) {
    if (index >= 7) return "bg-green-600";
    if (index >= 4) return "bg-yellow-400";
    return "bg-red-400";
  }
  return "bg-gray-200";
}

export default function TimeSlot({ slot, onScreenshotClick }) {
  // Function to compute activity level for a single screenshot/log entry
  const computeScreenshotActivityLevel = (log) => {
    const keyboardCount = log.keyboardCount || 0;
    const mouseCount = log.mouseCount || 0;
    const duration = log.duration || 600; // Default 10 minutes if not provided
    
    // Calculate activity per minute
    const durationInMinutes = duration / 60;
    const kbPerMin = keyboardCount / durationInMinutes;
    const mousePerMin = mouseCount / durationInMinutes;
    
    // Weighted score (keyboard events weighted 1.5, mouse events weighted 2.0)
    const weightedScore = kbPerMin * 1.5 + mousePerMin * 2.0;
    
    // Max possible score per minute (assuming 60 keyboard + 40 mouse events per minute)
    const maxPossiblePerMin = (60 * 1.5 + 40 * 2.0);
    
    // Calculate activity level out of 10
    const activityLevel = Math.min(10, Math.round((weightedScore / maxPossiblePerMin) * 10));
    
    return Math.max(0, activityLevel); // Ensure it's not negative
  };

  // Function to compute overall activity level for the entire slot
  const computeSlotActivityLevel = (slot) => {
    const logs = slot.logs || [];
    
    if (logs.length === 0) return 0;
    
    // Calculate total metrics
    const totalKeyboard = logs.reduce((sum, log) => sum + (log.keyboardCount || 0), 0);
    const totalMouse = logs.reduce((sum, log) => sum + (log.mouseCount || 0), 0);
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 600), 0);
    
    if (totalDuration === 0) return 0;
    
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

  // Calculate the overall slot activity level
  const slotActivityLevel = computeSlotActivityLevel(slot);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold">
            {slot.startTime} - {slot.endTime}
          </h3>
          
        </div>
        <div className="flex gap-1 justify-center">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-sm ${getBarColor(i, slotActivityLevel)}`} 
                />
              ))}
            </div>
        {/* <button className="text-gray-400 hover:text-gray-600">⋯</button> */}
      </div>

      {slot.logs && slot.logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {slot.logs.map((screenshot, screenshotIndex) => {
            // Calculate activity level for this specific screenshot
            const screenshotActivityLevel = computeScreenshotActivityLevel(screenshot);
            
            return (
              <div key={screenshotIndex} className="relative">
                <img
                  src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${screenshot.screenshotName}`}
                  alt="Activity screenshot"
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                  onClick={() => onScreenshotClick(screenshot)}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1">
                  <div className="text-xs text-white text-center">
                    {dayjs(screenshot.timestamp).format("h:mm A")}
                  </div>
                  <div className="text-xs text-white text-center font-semibold mb-1">
                    Activity: {screenshotActivityLevel}/10
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}