import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { X } from "lucide-react";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import { ChevronLeft, ChevronRight, Trash2, Keyboard, Mouse, Search, Activity, BarChart3 } from 'lucide-react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { Bar } from 'react-chartjs-2';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const EnhancedModal = styled(Modal)(({ theme }) => ({
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
  },
}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  backgroundColor: '#ffffff',
  border: 'none',
  borderRadius: '16px',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
  maxHeight: '85vh',
  overflowY: 'auto',
  outline: 'none',
};

function getBarColor(index, level) {
  if (index < level) {
    if (index >= 7) return "bg-green-600";
    if (index >= 4) return "bg-yellow-400";
    return "bg-red-400";
  }
  return "bg-gray-200";
}

function StatCard({ icon: Icon, label, value, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-white bg-opacity-60">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ActivityModal({
  activityLogs,
  activity,
  currentIndex,
  handlePrev,
  handleNext,
  deleteScreenShot,
  showDetailModal,
  setShowDetailModal,
}) {
  const [openDetailView, setOpenDetailView] = useState(false);
  const [searchKey, setSearchKey] = useState("");

  const handleClose = () => setShowDetailModal(false);
  const handleOpenDetail = () => setOpenDetailView(true);
  const handleCloseDetail = () => setOpenDetailView(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // const activityLevel = computeActivityLevel(activity.keyboardCount, activity.mouseCount);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // function computeActivityLevel(keyboardCount, mouseCount) {
  //   const weightedScore = keyboardCount * 1.5 + mouseCount * 2.0;
  //   const maxActivity = 100;
  //   return Math.min(10, Math.round((weightedScore / maxActivity) * 10));
  // }

  function getActivityAverages(duration, keyboardCount, mouseCount) {
    if (duration === 0) return { perMinute: {} };
    return {
      perMinute: {
        keyboard: ((keyboardCount / duration) * 60).toFixed(2),
        mouse: ((mouseCount / duration) * 60).toFixed(2),
      }
    };
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function computeActivityLevelFromAvg(kbPerMin, mousePerMin, durationInSeconds) {
    const weightedScore = kbPerMin * 1.5 + mousePerMin * 2.0;
    const durationInMinutes = durationInSeconds / 60;
    const maxPossible = (60 * 1.5 + 40 * 2.0) * durationInMinutes;
    return Math.min(10, Math.round(((weightedScore * durationInMinutes) / maxPossible) * 10));
  }

  const { perMinute } = getActivityAverages(activity.duration, activity.keyboardCount, activity.mouseCount);

  const filteredKeyPresses = searchKey
    ? Object.entries(activity.keyPressDetails || {}).filter(([key]) => key.toLowerCase().includes(searchKey.toLowerCase()))
    : Object.entries(activity.keyPressDetails || {});

  return (
    <>
      <BootstrapDialog open={showDetailModal} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {dayjs(activity.timestamp).format("MMMM D, YYYY • h:mm A")} • Tracked Activity
        </DialogTitle>
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8, color: "gray" }}>
          <X />
        </IconButton>
        <DialogContent dividers>
          <div className="absolute top-1/2 -left-0 transform -translate-y-1/2 z-10 ml-[6px]">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="bg-white border rounded-full shadow p-2 disabled:opacity-30">
              <ChevronLeft />
            </button>
          </div>
          <div className="absolute top-1/2 -right-0 transform -translate-y-1/2 z-10 mr-[6px]">
            <button onClick={handleNext} disabled={currentIndex === activityLogs.length - 1} className="bg-white border rounded-full shadow p-2 disabled:opacity-30">
              <ChevronRight />
            </button>
          </div>
          <div className="flex justify-center gap-6">
            <div className="lg:col-span-2 w-[580px]">
              <img src={`http://localhost:5000/uploads/${activity.screenshotName}`} alt="Activity screenshot" className="w-full rounded-lg border" />
              {/* <button onClick={() => deleteScreenShot(activity.id)} className="mt-4 text-md text-green-600 flex gap-[4px]">
                <Trash2 /> Remove
              </button> */}
              <button onClick={openModal} className="mt-4 text-md text-green-600 flex gap-[4px]">
                <Trash2 /> Remove
              </button>
              <div className="mt-2">
                <p className="font-semibold">Active Window</p>
                <p className="text-gray-600">{activity.appName} - {activity.windowTitle}</p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="font-semibold text-lg mb-2">Activity</h3>
              <hr className="mb-4" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span>Activity Level</span>
                  <span className="text-sm text-gray-500">{computeActivityLevelFromAvg(perMinute.keyboard, perMinute.mouse, activity.duration)} / 10</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${getBarColor(i, computeActivityLevelFromAvg(perMinute.keyboard, perMinute.mouse, activity.duration))}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Based on keyboard & mouse usage</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold mb-1">Memo</p>
                <p className="text-gray-600">{activity.memo}</p>
              </div>
              <div className="text-sm flex justify-between w-[180px]">
                <p><Keyboard /> {activity.keyboardCount}</p>
                <p><Mouse /> {activity.mouseCount}</p>
              </div>
              <div className="text-sm"> 
                <p><span className="font-semibold">Duration:</span> {formatTime(activity.duration)}</p>
              </div>
              <div className="font-semibold mt-4 mb-1">Average Per Minute</div>
              <div className="flex justify-between w-[180px]">
                <span><Keyboard /> {perMinute.keyboard}</span>
                <span><Mouse /> {perMinute.mouse}</span>
              </div>
              <div className="mt-6">
                <Button 
                  variant="contained" 
                  onClick={handleOpenDetail} 
                  startIcon={<BarChart3 size={18} />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '12px 24px',
                    fontSize: '14px',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Show Detailed Analytics
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions></DialogActions>
      </BootstrapDialog>

      <EnhancedModal open={openDetailView} onClose={handleCloseDetail}>
        <div style={modalStyle}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detailed Analytics</h2>
                <p className="text-sm text-gray-500">Comprehensive activity breakdown</p>
              </div>
            </div>
            <IconButton 
              onClick={handleCloseDetail}
              sx={{ 
                color: 'gray',
                '&:hover': { 
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <X size={20} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={Keyboard} 
                label="Total Keystrokes" 
                value={activity.keyboardCount} 
                color="blue"
              />
              <StatCard 
                icon={Mouse} 
                label="Mouse Actions" 
                value={activity.mouseCount} 
                color="green"
              />
              <StatCard 
                icon={Activity} 
                label="Unique Keys" 
                value={activity.totalUniqueKeys || Object.keys(activity.keyPressDetails || {}).length} 
                color="purple"
              />
              <StatCard 
                icon={BarChart3} 
                label="Activity Score" 
                value={`${computeActivityLevelFromAvg(perMinute.keyboard, perMinute.mouse, activity.duration)}/10`} 
                color="orange"
              />
            </div>

            {/* Most Pressed Key */}
            {activity.mostPressedKey && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Keyboard size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Most Active Key</h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                      {activity.mostPressedKey.key}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {activity.mostPressedKey.count} presses
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mouse Click Details */}
            {activity.mouseClickDetails && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <Mouse size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Mouse Activity Breakdown</h3>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(activity.mouseClickDetails).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="capitalize font-medium text-gray-700">{type}</span>
                        <span className="font-bold text-green-600">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-green-200">
                    <span className="font-semibold text-gray-900">Total Clicks</span>
                    <span className="font-bold text-green-700 text-lg">{activity.totalMouseClicks || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Key Press Details */}
            {activity.keyPressDetails && Object.keys(activity.keyPressDetails).length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <Search size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Key Press Distribution</h3>
                </div>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search for specific keys..."
                      className="w-full pl-10 pr-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-purple-200 shadow-sm">
                  <div className="max-h-80 overflow-y-auto">
                    <div className="grid gap-2 p-4">
                      {filteredKeyPresses
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, count], index) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                              <span className="font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
                                {key}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min(100, (count / Math.max(...Object.values(activity.keyPressDetails))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="font-semibold text-purple-600 w-12 text-right">{count}</span>
                            </div>
                          </div> 
                        ))}
                    </div>
                  </div>
                  
                  {filteredKeyPresses.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Search size={24} className="mx-auto mb-2 opacity-50" />
                      <p>No keys found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </EnhancedModal>
    <Modal
        open={isModalOpen}
        onClose={closeModal}
      >
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto mt-[14rem] outline-none">
          <h2 className="text-xl font-bold mb-4">
            Are you sure you want to delete this screenshot?
          </h2>
          <div className="flex justify-end gap-4">
            <button
              className="bg-gray-300 px-4 py-2 rounded-md"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md"
              onClick={() => {
                deleteScreenShot(activity.id);
                closeModal();
              }}
            >
              Yes, Delete it!
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
}