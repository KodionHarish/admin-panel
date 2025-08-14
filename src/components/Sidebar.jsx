import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { logout } from "../features/auth/authSlice";
import Modal from "react-modal";
import img from "../assets/image.png";
import { LogOut } from "lucide-react";
import { useState } from "react";

const Sidebar = ({ setViewMode }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/logout`,
        // `http://localhost:5000/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    // { label: "Profile", path: "/dashboard/profile" },
    { label: "Users Activity", path: "/dashboard/users/daily-activity" },
    { label: "Users", path: "/dashboard/users/all-users" },
    // { label: "Ignored Jobs", path: "/dashboard/ignored-jobs" },
  ];
  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };
  const handleNavigation = (path) => {
    if (setViewMode) {
      setViewMode("summary");
    }
    navigate(path);
  };
  return (
    <>
      <aside className="w-[17rem] bg-[#343A40] text-white p-4 min-h-screen">
        <div className="mt-3 mb-6">
          <img src={img} alt="Logo" />
        </div>
        <ul className="space-y-2 mt-4 border-t border-[#4f5962] pt-4">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`p-3 flex items-center gap-3 rounded cursor-pointer transition-all ${
                isActive(item.path)
                  ? "bg-[#007BFF] text-white font-semibold"
                  : "hover:bg-[#494E53]"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
          <li
            className="hover:bg-red-600 p-3 rounded cursor-pointer mt-6 flex items-center gap-3"
            onClick={openModal}
          >
            <LogOut size={18} />
            Logout
          </li>
        </ul>
      </aside>

      {/* Logout Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Logout"
        className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto mt-[14rem] outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
      >
        <h2 className="text-xl font-bold mb-4">
          Are you sure you want to log out?
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
            onClick={handleLogout}
          >
            Yes, Logout
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;