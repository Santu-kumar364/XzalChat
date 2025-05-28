import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../config/firebase";

const ChatBox = () => {
  const { userData, chatUser, messages, setMessages, messageId } =
    useContext(AppContext);
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const sendMessage = async () => {
    try {
      if (!input.trim() || !messageId) return;

      const lastMessage = input.length > 25 ? `${input.slice(0, 25)}...` : input;
      const newMessage = {
        sId: userData.id,
        content: input,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        type: "text",
        createdAt: new Date(),
      };

      await Promise.all([
        updateDoc(doc(db, "messages", messageId), {
          messages: arrayUnion(newMessage),
        }),
        updateChatDocument(userData.id, messageId, lastMessage, true),
        updateChatDocument(chatUser.id, messageId, lastMessage, false),
      ]);

      if (isMounted) {
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
      }
    } catch (error) {
      console.error("Message send error:", error);
      if (isMounted) {
        toast.error("Failed to send message");
      }
    }
  };

  const updateChatDocument = async (userId, messageId, lastMessage, isSender) => {
    const userChatRef = doc(db, "chats", userId);

    try {
      const userChatsSnapshot = await getDoc(userChatRef);
      let chatData = [];

      if (userChatsSnapshot.exists()) {
        chatData = [...userChatsSnapshot.data().chatData];
      }

      const chatIndex = chatData.findIndex((c) => c.messageId === messageId);
      const updatedChat = {
        rId: isSender ? chatUser.id : userData.id,
        lastMessage,
        updatedAt: new Date(),
        messageId,
        messageSeen: isSender,
      };

      if (chatIndex !== -1) {
        chatData[chatIndex] = updatedChat;
      } else {
        chatData.push(updatedChat);
      }

      await updateDoc(userChatRef, { chatData });
    } catch (error) {
      console.error("Error updating chat document:", error);
    }
  };

  useEffect(() => {
    if (!messageId || !isMounted) return;

    const unsubscribe = onSnapshot(doc(db, "messages", messageId), (doc) => {
      if (doc.exists() && isMounted) {
        setMessages(doc.data().messages || []);
      }
    });

    return () => unsubscribe();
  }, [messageId, isMounted]);

  if (!chatUser) {
    return (
      <div className="chat-welcome">
        <h2>Welcome to XzalChat</h2>
        <p>Search for users to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-user">
        <img
          src={chatUser.avatar || assets.Myphoto}
          alt="User profile"
          onError={(e) => {
            e.target.src = assets.Myphoto;
          }}
        />
        <p>
          {chatUser.name || chatUser.username}
          <img className="dot" src={assets.green_dot} alt="Online status" />
        </p>
        <img src={assets.help_icon} alt="Help" className="help" />
      </div>

      <div className="chat-msg">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={index}
              className={message.sId === userData.id ? "s-msg" : "r-msg"}
            >
              {message.type === "text" ? (
                <p className="msg">{message.content}</p>
              ) : (
                <img className="img-msg" src={message.content} alt="" />
              )}
              <div>
                <img
                  src={
                    message.sId === userData.id
                      ? userData.avatar || assets.profile_img
                      : chatUser.avatar || assets.profile_img
                  }
                  alt=""
                />
                <p>{message.timestamp}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            Start a new conversation with {chatUser.name || chatUser.username}
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <input type="file" id="image" accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  );
};

export default ChatBox;