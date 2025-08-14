import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Modal from "react-modal";
import UsersList from "../../components/UsersList";
Modal.setAppElement("#root");

const UserActivity = () => {
  const [viewMode, setViewMode] = useState("summary");

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setViewMode={setViewMode} />

      <main className="flex-1 p-8 overflow-y-auto">
        <UsersList viewMode={viewMode} setViewMode={setViewMode} />
      </main>
    </div>
  );
};

export default UserActivity;