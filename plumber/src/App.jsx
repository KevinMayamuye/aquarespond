import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import ReportAssignments from "./pages/ReportAssignments";
import History from "./pages/History";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import PlumberShell from "./layouts/PlumberShell";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PlumberShell />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate to="jobs" replace />
          }
        />
        <Route path="jobs" element={<Jobs />} />
        <Route
          path="reports"
          element={<ReportAssignments />}
        />
        <Route
          path="history"
          element={<History />}
        />
        <Route path="chat" element={<Chat />} />
        <Route
          path="profile"
          element={<Profile />}
        />
      </Route>
    </Routes>
  );
}

export default App;
