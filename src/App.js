import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { lazy, Suspense } from "react";
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from "./store/store";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Loader from "./components/utils/Loader";

const Login = lazy(() => import("./pages/auth/Login"));
const Charts = lazy(() => import("./pages/dashboard/Charts"));
const UserActivity = lazy(() => import("./pages/dashboard/UserActivity"));
const UsersAll = lazy(() => import("./pages/dashboard/Users"));

function App() {
  const token = useSelector((state) => state.auth.token);
  
  return (
    <PersistGate loading={<Loader />} persistor={persistor}>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route
              path="/"
              element={
                token ? (
                  <Navigate to="/dashboard/users/daily-activity" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Charts />} />
              <Route
                path="/dashboard/users/daily-activity"
                element={<UserActivity />}
              />
              <Route path="/dashboard/users/all-users" element={<UsersAll />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </PersistGate>
  );
}

export default App;

// import { BrowserRouter as Router , Routes , Route , Navigate, } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { lazy , Suspense } from "react";
// // import Login from "./pages/auth/Login";
// import PrivateRoute from "./components/PrivateRoute";
// import PublicRoute from "./components/PublicRoute";
// import "react-toastify/dist/ReactToastify.css";
// import "./App.css";
// import Loader from "./components/utils/Loader";
// const Login = lazy(() => import("./pages/auth/Login"));
// const Charts = lazy(() => import("./pages/dashboard/Charts"));
// const UserActivity = lazy(() => import("./pages/dashboard/UserActivity"));
// const UsersAll = lazy(() => import("./pages/dashboard/Users"));

// function App() {
//   const token = useSelector((state) => state.auth.token);
//   return (
//     <Router>
//       <Suspense fallback = {<Loader/>}>
//         <Routes>
//           <Route
//             path="/"
//             element={
//               token ? (
//                 <Navigate to="/dashboard/users/daily-activity" replace />
//               ) : (
//                 <Navigate to="/login" replace />
//               )
//             }
//           />

//           {/* Public Routes */}
//           <Route element={<PublicRoute />}>
//             <Route path="/login" element={<Login />} />
//           </Route>

//           {/* Protected Routes */}
//           <Route element={<PrivateRoute />}>
//             <Route path="/dashboard" element={<Charts />} />
//             <Route
//               path="/dashboard/users/daily-activity"
//               element={<UserActivity />}
//             />
//             <Route path="/dashboard/users/all-users" element={<UsersAll />} />
//           </Route>

//           {/* Catch-all */}
//           <Route path="*" element={<Navigate to="/" replace />} />  
//         </Routes> 
//       </Suspense>
//     </Router>
//   );
// }

// export default App;