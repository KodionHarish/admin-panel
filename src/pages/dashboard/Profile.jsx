import Sidebar from "../../components/Sidebar";

const Profile = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">Welcome to Profile Page!</main>
    </div>
  );
};

export default Profile;