// LeftSideBar.js
import React, { useContext, useState, useEffect } from "react";
import "./LeftSideBar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSideBar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData, chatUser, setChatUser, setMessageId } =
    useContext(AppContext);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [existingChats, setExistingChats] = useState([]);

  useEffect(() => {
    if (!userData?.id) return;

    const chatRef = doc(db, "chats", userData.id);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchChatsWithUserData = async () => {
          try {
            const chatData = snapshot.data().chatData || [];
            const chatsWithUserData = await Promise.all(
              chatData.map(async (chat) => {
                try {
                  const userRef = doc(db, "users", chat.rId);
                  const userSnap = await getDoc(userRef);
                  return {
                    ...chat,
                    userData: userSnap.exists() ? userSnap.data() : null,
                  };
                } catch (error) {
                  return { ...chat, userData: null };
                }
              })
            );

            const sortedChats = chatsWithUserData.sort(
              (a, b) => b.updatedAt - a.updatedAt
            );
            setExistingChats(sortedChats);
          } catch (error) {
            console.error("Error processing chats:", error);
          }
        };

        fetchChatsWithUserData();
      }
    });

    return () => unsubscribe();
  }, [userData?.id]);

  const inputHandler = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    setSearchQuery(searchTerm);

    if (searchTerm.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const filteredChats = existingChats.filter((chat) => {
      const name = chat.userData?.name?.toLowerCase() || "";
      const username = chat.userData?.username?.toLowerCase() || "";
      const email = chat.userData?.email?.toLowerCase() || "";
      return (
        name.includes(searchTerm) ||
        username.includes(searchTerm) ||
        email.includes(searchTerm)
      );
    });

    setSearchResults(filteredChats);
    setIsSearching(false);
  };

  const addChat = async (user) => {
    try {
      const messagesRef = collection(db, "messages");
      const chatsRef = collection(db, "chats");
      const newMessageRef = doc(messagesRef);

      await Promise.all([
        setDoc(newMessageRef, {
          createdAt: serverTimestamp(),
          messages: [],
        }),
        updateDoc(doc(chatsRef, user.id), {
          chatData: arrayUnion({
            lastMessage: "",
            rId: userData.id,
            updatedAt: Date.now(),
            messageId: newMessageRef.id,
            messageSeen: true,
          }),
        }),
        updateDoc(doc(chatsRef, userData.id), {
          chatData: arrayUnion({
            lastMessage: "",
            rId: user.id,
            updatedAt: Date.now(),
            messageId: newMessageRef.id,
            messageSeen: true,
          }),
        }),
      ]);

      setChatUser({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      });
      setMessageId(newMessageRef.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChatSelect = (chat) => {
    setMessageId(chat.messageId);
    setChatUser({
      id: chat.rId,
      name: chat.userData?.name,
      username: chat.userData?.username,
      avatar: chat.userData?.avatar,
    });
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src="/chat_logo.jpeg" alt="Chat App Logo" className="logo" />
          <div className="menu">
            <img
              src={assets.menu_icon}
              alt="Menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="sub-menu">
                <p onClick={() => navigate("/profile")}>Edit Profile</p>
                <hr />
                <p onClick={() => logout()}>Logout</p>
              </div>
            )}
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
          />
        </div>
      </div>

      <div className="ls-list">
        {searchQuery.length > 0 ? (
          isSearching ? (
            <div className="loading">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((chat) => (
              <div
                onClick={() => handleChatSelect(chat)}
                className={`friends ${
                  chatUser?.id === chat.rId ? "active" : ""
                }`}
                key={chat.messageId}
              >
                <img
                  src={chat.userData?.avatar || assets.profile_img}
                  alt={chat.userData?.name || chat.userData?.username}
                  onError={(e) => (e.target.src = assets.profile_img)}
                />
                <div className="friend-info">
                  <p className="friend-name">
                    {chat.userData?.name || chat.userData?.username}
                  </p>
                  <p className="friend-time">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
                {!chat.messageSeen && <span className="unread-badge"></span>}
              </div>
            ))
          ) : (
            <div className="no-results">No users found</div>
          )
        ) : existingChats.length > 0 ? (
          existingChats.map((chat) => (
            <div
              onClick={() => handleChatSelect(chat)}
              className={`friends ${chatUser?.id === chat.rId ? "active" : ""}`}
              key={chat.messageId}
            >
              <img
                src={chat.userData?.avatar || assets.profile_img}
                alt={chat.userData?.name || chat.userData?.username}
                onError={(e) => (e.target.src = assets.profile_img)}
              />
              <div className="friend-info">
                <p className="friend-name">
                  {chat.userData?.name || chat.userData?.username}
                </p>
                <p className="friend-time">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
              {!chat.messageSeen && <span className="unread-badge"></span>}
            </div>
          ))
        ) : (
          <div className="no-chats">No existing chats</div>
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
