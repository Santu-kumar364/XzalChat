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
  const { userData, chatUser, setChatUser, setMessageId } = useContext(AppContext);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [existingChats, setExistingChats] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!userData?.id || !isMounted) return;

    const chatRef = doc(db, "chats", userData.id);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (!isMounted) return;

      if (snapshot.exists()) {
        const fetchChatsWithUserData = async () => {
          try {
            const chatData = snapshot.data().chatData;
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
                  console.error("Error fetching user data:", error);
                  return {
                    ...chat,
                    userData: null,
                  };
                }
              })
            );

            if (isMounted) {
              const sortedChats = chatsWithUserData.sort(
                (a, b) => b.updatedAt - a.updatedAt
              );
              setExistingChats(sortedChats);
            }
          } catch (error) {
            console.error("Error processing chats:", error);
          }
        };

        fetchChatsWithUserData();
      }
    });

    return () => unsubscribe();
  }, [userData?.id, isMounted]);

  const inputHandler = async (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    setSearchQuery(searchTerm);

    if (searchTerm.length === 0) {
      if (isMounted) {
        setSearchResults([]);
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      const queries = [
        query(
          usersRef,
          where("username", ">=", searchTerm),
          where("username", "<=", searchTerm + "\uf8ff")
        ),
        query(usersRef, where("email", "==", searchTerm)),
      ];

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      const results = [];

      snapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
          const user = doc.data();
          if (user.id !== userData?.id && !results.some(r => r.id === user.id)) {
            results.push(user);
          }
        });
      });

      if (isMounted) {
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error:", error);
      if (isMounted) {
        setSearchResults([]);
      }
    } finally {
      if (isMounted) {
        setIsSearching(false);
      }
    }
  };

  const addChat = async (user) => {
    if (!isMounted) return;

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

      if (isMounted) {
        setChatUser({
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        });
        setMessageId(newMessageRef.id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      if (isMounted) {
        toast.error(error.message);
      }
    }
  };

  const handleChatSelect = (chat) => {
    if (!isMounted) return;

    setMessageId(chat.messageId);
    setChatUser({
      id: chat.rId,
      name: chat.userData?.name,
      username: chat.userData?.username,
      avatar: chat.userData?.avatar,
    });
  };

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} alt="Chat App Logo" className="logo" />
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
          <>
            {isSearching ? (
              <div className="loading">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  onClick={() => addChat(user)}
                  className="friends add-user"
                  key={user.id}
                >
                  <img
                    src={user.avatar || assets.profile_img}
                    alt={user.name || user.username}
                    onError={(e) => (e.target.src = assets.profile_img)}
                  />
                  <div className="friend-info">
                    <p className="friend-name">{user.name || user.username}</p>
                    <p className="friend-time">New chat</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">No users found</div>
            )}
          </>
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