 
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingChats, setExistingChats] = useState([]);

  const {
    userData,
    chatUser,
    setChatUser,
    setMessageId,
    chatDisplay,
    setChatDisplay,
  } = useContext(AppContext);

  useEffect(() => {
    if (!userData?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "chats", userData.id),
      async (snapshot) => {
        if (!snapshot.exists()) return;

        const chatData = snapshot.data().chatData || [];
        const chatsWithUserData = await Promise.all(
          chatData.map(async (chat) => {
            try {
              const userSnap = await getDoc(doc(db, "users", chat.rId));
              return {
                ...chat,
                userData: userSnap.exists() ? userSnap.data() : null,
              };
            } catch {
              return { ...chat, userData: null };
            }
          })
        );

        setExistingChats(
          chatsWithUserData.sort((a, b) => b.updatedAt - a.updatedAt)
        );
      }
    );

    return unsubscribe;
  }, [userData?.id]);

  const searchAllUsers = async (term) => {
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", term),
        where("username", "<=", term + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .filter((doc) => doc.id !== userData.id)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  };

  const inputHandler = async (e) => {
    const term = e.target.value.trim().toLowerCase();
    setSearchQuery(term);

    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filtered = existingChats.filter(({ userData }) => {
      const fields = [userData?.name, userData?.username, userData?.email].map(
        (f) => f?.toLowerCase() || ""
      );
      return fields.some((field) => field.includes(term));
    });

    if (filtered.length) {
      setSearchResults(filtered);
    } else {
      const allUsers = await searchAllUsers(term);
      setSearchResults(
        allUsers.map((user) => ({
          rId: user.id,
          userData: user,
          lastMessage: "",
          updatedAt: Date.now(),
          messageId: null,
          messageSeen: true,
        }))
      );
    }

    setIsSearching(false);
  };

  const addChat = async (user) => {
    try {
      const newMessageRef = doc(collection(db, "messages"));
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const chatObject = {
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageId: newMessageRef.id,
        messageSeen: true,
      };

      await Promise.all([
        updateDoc(doc(db, "chats", user.id), {
          chatData: arrayUnion({ ...chatObject, rId: userData.id }),
        }),
        updateDoc(doc(db, "chats", userData.id), {
          chatData: arrayUnion(chatObject),
        }),
      ]);

      setChatUser(user);
      setMessageId(newMessageRef.id);
      setChatDisplay(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChatSelect = async (chat) => {
  if (chat.messageId) {
    setMessageId(chat.messageId);
    setChatUser({
      id: chat.rId,
      ...chat.userData,
    });
  } else {
    await addChat(chat.userData);
  }

  setSearchQuery("");
  setSearchResults([]);
  setIsSearching(false);
  
  // Show chat box on mobile
  if (window.innerWidth <= 768) {
    setChatDisplay(true);
  }
};

  const renderChatList = (list) =>
    list.map((chat) => (
      <div
        key={chat.rId || chat.messageId}
        className={`friends ${chatUser?.id === chat.rId ? "active" : ""}`}
        onClick={() => handleChatSelect(chat)}
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
          <p className="friend-time">{chat.lastMessage || "No messages yet"}</p>
        </div>
        {!chat.messageSeen && <span className="unread-badge"></span>}
      </div>
    ));

  return (
    <div className={`ls ${chatDisplay ? "hidden" : ""}`}>
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
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={inputHandler}
          />
        </div>
      </div>

      <div className="ls-list">
        {searchQuery ? (
          isSearching ? (
            <div className="loading">Searching...</div>
          ) : searchResults.length ? (
            renderChatList(searchResults)
          ) : (
            <div className="no-results">No users found</div>
          )
        ) : existingChats.length ? (
          renderChatList(existingChats)
        ) : (
          <div className="no-chats">No existing chats</div>
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
 