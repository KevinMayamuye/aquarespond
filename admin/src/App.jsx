import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Overview from "./pages/Overview";
import WaterWasteReports from "./pages/WaterWasteReports";
import Users from "./pages/Users";
import Bookings from "./pages/Bookings";
import Ratings from "./pages/Ratings";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminShell from "./layouts/AdminShell";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route
          path="reports"
          element={<WaterWasteReports />}
        />
        <Route path="users" element={<Users />} />
        <Route
          path="bookings"
          element={<Bookings />}
        />
        <Route
          path="ratings"
          element={<Ratings />}
        />
        <Route path="chat" element={<Chat />} />
        <Route
          path="profile"
          element={<Profile />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
