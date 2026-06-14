import {
  createContext,
  useState,
} from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] =
    useState(null);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
