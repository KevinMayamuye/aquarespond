import {
  createContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "../services/api";
import { socket } from "../socket/socket";

const readStoredUser = () => {
  try {
    const stored =
      localStorage.getItem("adminUser");

    if (!stored) return null;

    return JSON.parse(stored);
  } catch {
    localStorage.removeItem("adminUser");
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      socket.disconnect();
      setUser(null);
      navigate("/", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (!user?.token) {
      socket.disconnect();
      return;
    }

    socket.auth = { token: user.token };

    if (!socket.connected) {
      socket.connect();
    }
  }, [user?.token]);

  const login = (userData) => {
    localStorage.setItem(
      "adminUser",
      JSON.stringify(userData)
    );
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("adminUser");
    socket.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
