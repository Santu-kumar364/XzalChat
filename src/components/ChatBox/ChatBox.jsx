 

import React, { useContext, useEffect, useRef, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "react-toastify";
import upload from "../../liberaries/upload";

const ChatBox = () => {
  const { userData, chatUser, messages, setMessages, messageId } =
    useContext(AppContext);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!messageId) return;

    const unsubscribe = onSnapshot(doc(db, "messages", messageId), (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
        scrollToBottom();
      }
    });

    return () => unsubscribe();
  }, [messageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageUpload = async (image) => {
    try {
      toast.info("Uploading image...");
      const url = await upload(image);
      toast.success("Image uploaded!");
      return url;
    } catch (error) {
      toast.error("Image upload failed");
      console.error("Upload error:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !image) || !messageId) {
      toast.warn("Cannot send empty message");
      return;
    }

    let uploadedImageUrl = "";
    if (image) uploadedImageUrl = await handleImageUpload(image);

    const newMessage = {
      sId: userData.id,
      content: {
        text: input.trim(),
        imageUrl: uploadedImageUrl,
      },
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: image ? "image" : "text",
      createdAt: Date.now(),
    };

    const lastMessage =
      input.length > 25
        ? `${input.slice(0, 25)}...`
        : input || "Image";

    try {
      await Promise.all([
        updateDoc(doc(db, "messages", messageId), {
          messages: arrayUnion(newMessage),
        }),
        updateChatDocument(userData.id, messageId, lastMessage, true),
        updateChatDocument(chatUser.id, messageId, lastMessage, false),
      ]);

      setInput("");
      setImage(null);
      setPreview(null);
      scrollToBottom();
    } catch (err) {
      console.error("sendMessage Error:", err);
      toast.error("Failed to send message. Check console for details.");
    }
  };

  const updateChatDocument = async (userId, messageId, lastMessage, isSender) => {
    const userChatRef = doc(db, "chats", userId);
    try {
      const chatSnap = await getDoc(userChatRef);
      let chatData = chatSnap.exists() ? [...chatSnap.data().chatData] : [];

      const index = chatData.findIndex((c) => c.messageId === messageId);
      const updated = {
        rId: isSender ? chatUser.id : userData.id,
        lastMessage,
        updatedAt:Date.now(),
        messageId,
        messageSeen: isSender,
      };

      if (index !== -1) chatData[index] = updated;
      else chatData.push(updated);

      await updateDoc(userChatRef, { chatData });
    } catch (err) {
      console.error("Chat update failed", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
          alt="User"
          onError={(e) => (e.target.src = assets.Myphoto)}
        />
        <p>
          {chatUser.name || chatUser.username}
          <img className="dot" src={assets.green_dot} alt="Online" />
        </p>
        <img src={assets.help_icon} alt="Help" className="help" />
      </div>

      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${
                msg.sId === userData.id ? "sent" : "received"
              }`}
            >
              {msg.content.imageUrl && (
                <img className="uploaded-image" src={msg.content.imageUrl} alt="uploaded" />
              )}
              {msg.content.text && (
                <p className="text-message">{msg.content.text}</p>
              )}
              <span>{msg.timestamp}</span>
            </div>
          ))
        ) : (
          <div className="no-messages">
            Start conversation with {chatUser.name || chatUser.username}
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input">
        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <button onClick={() => { setImage(null); setPreview(null); }}>✕</button>
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={handleKeyDown}
        />
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <label htmlFor="imageUpload">
          <img src={assets.gallery_icon} alt="Upload" />
        </label>
        <button onClick={sendMessage} disabled={!input.trim() && !image}>
          <img src={assets.send_button} alt="Send" />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;

