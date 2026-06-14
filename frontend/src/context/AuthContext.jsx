import {
  createContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "../services/api";
import { socket } from "../socket/socket";
import { isTokenExpired } from "../utils/token";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("userInfo");

    if (!storedUser) {
      return null;
    }

    const parsed = JSON.parse(storedUser);

    if (
      !parsed.token ||
      isTokenExpired(parsed.token)
    ) {
      localStorage.removeItem("userInfo");
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem("userInfo");
    return null;
  }
};

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
      "userInfo",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      const updated = { ...prev, ...partial };

      localStorage.setItem(
        "userInfo",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("userInfo");

    socket.disconnect();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
