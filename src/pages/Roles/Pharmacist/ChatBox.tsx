// src/pages/Roles/Pharmacist/ChatBox.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ChatBox.css";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string | Date;
}

interface ChatBoxProps {
  messages: Message[];
  contactName: string;
  contactAvatar?: string;
  currentUser: { id: string; name: string; avatar?: string };
  onSend: (message: string) => void;
  isTyping?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  contactName,
  contactAvatar,
  currentUser,
  onSend,
  isTyping = false,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }, [input, onSend]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.senderId === currentUser.id;
    const avatar = isUser ? currentUser.avatar : contactAvatar;

    return (
      <div key={msg.id} className={`message ${isUser ? "sent" : "received"}`}>
        {!isUser && (
          <div className="avatar">
            {avatar ? <img src={avatar} alt={msg.senderName} /> : msg.senderName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="message-content">
          <p>{msg.text}</p>
          <span className="timestamp">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {isUser && (
          <div className="avatar user">
            {avatar ? <img src={avatar} alt={currentUser.name} /> : currentUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>{contactName}</h3>
        <div className="status-indicator online" />
      </div>

      <div className="messages-container">
        {messages.map(renderMessage)}

        {isTyping && (
          <div className="typing-indicator">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
            <span>{contactName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;