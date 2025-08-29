// UTILITY: utils/timeUtils.js
import dayjs from 'dayjs';

export const groupLogsByTimeSlots = (logs) => {
  const timeSlots = {};

  logs.forEach(log => {
    const logTime = dayjs(log.timestamp);


    const hour = logTime.hour();
    const slotKey = `${hour.toString().padStart(2, '0')}:00`;

    if (!timeSlots[slotKey]) {
      const start = logTime.minute(0).second(0);
      const end = start.add(1, 'hour');
      
      timeSlots[slotKey] = {
        startTime: start.format('HH:mm'),
        endTime: end.format('HH:mm'),
        logs: [],
        totalDuration: 0,
        screenshots: []
      };
    }

    timeSlots[slotKey].logs.push(log);
    timeSlots[slotKey].totalDuration += log.duration;

    if (log.screenshotPath) {
      timeSlots[slotKey].screenshots.push(log);
    }
  });

  return Object.values(timeSlots).sort((a, b) => 
    dayjs(a.startTime, 'HH:mm').isBefore(dayjs(b.startTime, 'HH:mm')) ? -1 : 1
  );
};
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')} hrs` : `0:${minutes.toString().padStart(2, '0')} hrs`;
};

export const getTotalDuration = (logs) => {
  return logs.reduce((total, log) => total + log.duration, 0);
};