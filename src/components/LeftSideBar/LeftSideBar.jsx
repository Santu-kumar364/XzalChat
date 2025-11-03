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
  const [allUsers, setAllUsers] = useState([]); // Cache all users for search

  const {
    userData,
    chatUser,
    setChatUser,
    setMessageId,
    chatDisplay,
    setChatDisplay,
    isMobile,
    handleLogout,
  } = useContext(AppContext);

  // Load all users once when component mounts (with permission handling)
  useEffect(() => {
    const loadAllUsers = async () => {
      if (!userData?.id) return;

      try {
        console.log("Loading all users for search...");
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);

        const users = querySnapshot.docs
          .filter((doc) => doc.id !== userData.id) // Exclude current user
          .map((doc) => ({ id: doc.id, ...doc.data() }));

        console.log(`Loaded ${users.length} users for search`);
        setAllUsers(users);
      } catch (error) {
        console.warn(
          "Cannot load all users for search (permission issue):",
          error
        );
        // Continue without all users - we'll use existing chats only
        setAllUsers([]);
      }
    };

    loadAllUsers();
  }, [userData?.id]);

  useEffect(() => {
    if (!userData?.id) return;

    console.log("🔄 Setting up chats listener for user:", userData.id);

    const unsubscribe = onSnapshot(
      doc(db, "chats", userData.id),
      async (snapshot) => {
        console.log("📄 Chats snapshot received, exists:", snapshot.exists());

        if (!snapshot.exists()) {
          console.warn("❌ No chats document found for user:", userData.id);
          // Try to create the chats document if it doesn't exist
          try {
            await setDoc(doc(db, "chats", userData.id), {
              chatData: [],
              createdAt: serverTimestamp(),
            });
            console.log("✅ Created missing chats document");
          } catch (error) {
            console.error("Failed to create chats document:", error);
          }
          setExistingChats([]);
          return;
        }

        const chatData = snapshot.data().chatData || [];
        console.log("💬 Chat data loaded:", chatData.length, "chats");

        const chatsWithUserData = await Promise.all(
          chatData.map(async (chat) => {
            try {
              console.log("Loading user data for:", chat.rId);
              const userSnap = await getDoc(doc(db, "users", chat.rId));
              if (!userSnap.exists()) {
                console.warn("User not found:", chat.rId);
                return { ...chat, userData: null };
              }
              return {
                ...chat,
                userData: userSnap.data(),
              };
            } catch (error) {
              console.error("Error loading user data for", chat.rId, error);
              return { ...chat, userData: null };
            }
          })
        );

        const validChats = chatsWithUserData.filter(
          (chat) => chat.userData !== null
        );
        console.log("✅ Valid chats with user data:", validChats.length);

        setExistingChats(validChats.sort((a, b) => b.updatedAt - a.updatedAt));
      },
      (error) => {
        console.error("❌ Error in chats listener:", error);
      }
    );

    return unsubscribe;
  }, [userData?.id]);

  // Simple client-side search that works with or without full user access
  const searchUsers = (term) => {
    const searchTerm = term.toLowerCase();

    // First, search in existing chats
    const existingChatResults = existingChats.filter(({ userData }) => {
      if (!userData) return false;

      return (
        userData.name?.toLowerCase().includes(searchTerm) ||
        userData.username?.toLowerCase().includes(searchTerm) ||
        userData.email?.toLowerCase().includes(searchTerm)
      );
    });

    // If we have access to all users, search there too
    if (allUsers.length > 0) {
      const allUserResults = allUsers
        .filter(
          (user) =>
            user.name?.toLowerCase().includes(searchTerm) ||
            user.username?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
        )
        .map((user) => ({
          rId: user.id,
          userData: user,
          lastMessage: "",
          updatedAt: Date.now(),
          messageId: null,
          messageSeen: true,
        }));

      // Combine and remove duplicates
      const combinedResults = [...existingChatResults, ...allUserResults];
      const uniqueResults = combinedResults.filter(
        (chat, index, self) =>
          index === self.findIndex((c) => c.rId === chat.rId)
      );

      return uniqueResults;
    }

    return existingChatResults;
  };

  const inputHandler = async (e) => {
    const term = e.target.value.trim();
    setSearchQuery(term);

    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Use setTimeout to debounce and show loading state
    setTimeout(() => {
      try {
        const results = searchUsers(term);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
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
      toast.success(`Chat started with ${user.name || user.username}`);
    } catch (error) {
      console.error("Error adding chat:", error);
      toast.error(error.message);
    }
  };

  const handleChatSelect = async (chat) => {
    try {
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

      if (isMobile) {
        setChatDisplay(true);
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
      toast.error("Failed to open chat");
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

  const handleMenuLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  return (
    <div className={`ls ${chatDisplay ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo2} alt="Chat App Logo" className="logo" />
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
                <p onClick={handleMenuLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            type="text"
            placeholder="Search users..."
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
            <div className="no-results">
              {allUsers.length > 0
                ? "No users found"
                : "No users found in your chats"}
            </div>
          )
        ) : existingChats.length ? (
          renderChatList(existingChats)
        ) : (
          <div className="no-chats">
            No chats yet. Search for users to start chatting!
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
