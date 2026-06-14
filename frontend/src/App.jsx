import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Book from "./pages/Book";
import History from "./pages/History";
import Report from "./pages/Report";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./layouts/AppShell";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/chat"
        element={
          <Navigate to="/dashboard/chat" replace />
        }
      />

      <Route
        path="/profile"
        element={
          <Navigate
            to="/dashboard/profile"
            replace
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate to="book" replace />
          }
        />
        <Route path="chat" element={<Chat />} />
        <Route path="book" element={<Book />} />
        <Route
          path="history"
          element={<History />}
        />
        <Route
          path="report"
          element={<Report />}
        />
        <Route
          path="profile"
          element={<Profile />}
        />
      </Route>
    </Routes>
  );
}

export default App;
