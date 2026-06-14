import "../styles/chat.css";

import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

import { useChat } from "../hooks/useChat";

const Chat = () => {
  const { selectedChat } = useChat();

  return (
    <div
      className={`chat-container ${
        selectedChat ? "show-conversation" : "show-list"
      }`}
    >
      <ChatSidebar />

      <ChatWindow />
    </div>
  );
};

export default Chat;
