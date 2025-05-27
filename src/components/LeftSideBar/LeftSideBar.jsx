// import React, { useContext, useState } from "react";
// import "./LeftSideBar.css";
// import assets from "../../assets/assets";
// import { useNavigate } from "react-router-dom";
// import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
// import { db, logout } from "../../config/firebase";
// import { AppContext } from "../../context/AppContext";
// import { toast } from "react-toastify";

// const LeftSideBar = () => {
//   const navigate = useNavigate();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const { userData,chatData,chatUser, setChatUser } = useContext(AppContext);
//   const [searchResults, setSearchResults] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSearching, setIsSearching] = useState(false);

//   const inputHandler = async (e) => {
//     const searchTerm = e.target.value.trim().toLowerCase();
//     setSearchQuery(searchTerm);

//     if (searchTerm.length === 0) {
//       setSearchResults([]);
//       setIsSearching(false);
//       return;
//     }

//     setIsSearching(true);
//     try {
//       const usersRef = collection(db, "users");

//       // Create a query that searches for username or email
//       const usernameQuery = query(
//         usersRef,
//         where("username", ">=", searchTerm),
//         where("username", "<=", searchTerm + "\uf8ff")
//       );

//       const emailQuery = query(usersRef, where("email", "==", searchTerm));

//       // Execute both queries
//       const [usernameSnapshot, emailSnapshot] = await Promise.all([
//         getDocs(usernameQuery),
//         getDocs(emailQuery),
//       ]);

//       const results = [];

//       // Process username results
//       usernameSnapshot.forEach((doc) => {
//         const user = doc.data();
//         if (
//           user.id !== userData?.id &&
//           !results.some((r) => r.id === user.id)
//         ) {
//           results.push(user);
//         }
//       });

//       // Process email results
//       emailSnapshot.forEach((doc) => {
//         const user = doc.data();
//         if (
//           user.id !== userData?.id &&
//           !results.some((r) => r.id === user.id)
//         ) {
//           results.push(user);
//         }
//       });

//       setSearchResults(results);
//     } catch (error) {
//       console.error("Search error:", error);
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const addChat = async (user) => {
//     const messagesRef = collection(db, "messages");
//     const chatsRef = collection(db, "chats");
//     try {
//       const newMessageRef = doc(messagesRef);

//       await setDoc(newMessageRef, {
//         createAt: serverTimestamp(),
//         messages: [],
//       });
//       await updateDoc(doc(chatsRef, user.id), {
//         chatData: arrayUnion({
//           lastMessage: "",
//           rId: userData.id,
//           updatedAt: Date.now(),
//           messageId: newMessageRef.id,
//           messageSeen: true,
//         }),
//       });

//       await updateDoc(doc(chatsRef, userData.id), {
//         chatData: arrayUnion({
//           lastMessage: "",
//           rId: user.id,
//           updatedAt: Date.now(),
//           messageId: newMessageRef.id,
//           messageSeen: true,
//         }),
//       });

//       setChatUser({
//       id: user.id,
//       name: user.name,
//       username: user.username,
//       avatar: user.avatar
//     });

//     } catch (error) {
//       toast.error(error.message);
//       console.error(error)
//     }
//   };

//   const setChatData = async (item) => {
//     setMessageId(item.messageId);
//     setChatUser(item)

//   }

//   return (
//     <div className="ls">
//       <div className="ls-top">
//         <div className="ls-nav">
//           <img src={assets.logo} alt="Chat App Logo" className="logo" />
//           <div className="menu">
//             <img
//               src={assets.menu_icon}
//               alt="Menu"
//               onClick={() => setIsMenuOpen(!isMenuOpen)}
//             />
//             {isMenuOpen && (
//               <div className="sub-menu">
//                 <p onClick={() => navigate("/profile")}>Edit Profile</p>
//                 <hr />
//                 <p onClick={()=>logout()} >Logout</p>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className="ls-search">
//           <img src={assets.search_icon} alt="Search" />
//           <input
//             onChange={inputHandler}
//             type="text"
//             placeholder="Search by username or email..."
//             aria-label="Search contacts"
//             value={searchQuery}
//           />
//         </div>
//       </div>

//       <div className="ls-list">
//         {searchQuery.length > 0 ? (
//           <>
//             {isSearching ? (
//               <div className="loading">Searching...</div>
//             ) : searchResults.length > 0 ? (
//               searchResults.map((user) => (
//                 <div
//                   onClick={()=>addChat(user)}
//                   className="friends add-user"
//                   key={user.id}
//                 >
//                   <img
//                     src={user.avatar || assets.profile_img}
//                     alt={user.name || user.username}
//                     onError={(e) => {
//                       e.target.src = assets.profile_img;
//                     }}
//                   />
//                   <div className="friend-info">
//                     <p className="friend-name">{user.name || user.username}</p>
//                     <p className="friend-time">{user.lastMessage}</p>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="no-results">No users found</div>
//             )}
//           </>
//         ) : null}
//       </div>
//     </div>
//   );
// };

// export default LeftSideBar;


import React, { useContext, useState, useEffect } from "react";
import "./LeftSideBar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db, logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSideBar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userData, chatData, chatUser, setChatUser, setMessageId } = useContext(AppContext);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [existingChats, setExistingChats] = useState([]);

  // Load existing chats when component mounts or chatData changes
  useEffect(() => {
    if (chatData) {
      const formattedChats = chatData.map(chat => ({
        id: chat.rId,
        name: chat.userData?.name,
        username: chat.userData?.username,
        avatar: chat.userData?.avatar,
        lastMessage: chat.lastMessage,
        messageId: chat.messageId
      }));
      setExistingChats(formattedChats);
    }
  }, [chatData]);

  const inputHandler = async (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    setSearchQuery(searchTerm);

    if (searchTerm.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      const usernameQuery = query(
        usersRef,
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff")
      );
      const emailQuery = query(usersRef, where("email", "==", searchTerm));

      const [usernameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(emailQuery),
      ]);

      const results = [];
      usernameSnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.id !== userData?.id && !results.some(r => r.id === user.id)) {
          results.push(user);
        }
      });

      emailSnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.id !== userData?.id && !results.some(r => r.id === user.id)) {
          results.push(user);
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addChat = async (user) => {
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");
    try {
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: [],
      });
      
      await updateDoc(doc(chatsRef, user.id), {
        chatData: arrayUnion({
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageId: newMessageRef.id,
          messageSeen: true,
        }),
      });

      await updateDoc(doc(chatsRef, userData.id), {
        chatData: arrayUnion({
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageId: newMessageRef.id,
          messageSeen: true,
        }),
      });

      setChatUser({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      });
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleChatSelect = (chat) => {
    setMessageId(chat.messageId);
    setChatUser({
      id: chat.id,
      name: chat.name,
      username: chat.username,
      avatar: chat.avatar
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
            aria-label="Search contacts"
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
                    onError={(e) => {
                      e.target.src = assets.profile_img;
                    }}
                  />
                  <div className="friend-info">
                    <p className="friend-name">{user.name || user.username}</p>
                    <p className="friend-time">{user.lastMessage}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">No users found</div>
            )}
          </>
        ) : (
          // Show existing chats when not searching
          existingChats.length > 0 ? (
            existingChats.map((chat) => (
              <div
                onClick={() => handleChatSelect(chat)}
                className={`friends ${chatUser?.id === chat.id ? 'active' : ''}`}
                key={chat.id}
              >
                <img
                  src={chat.avatar || assets.profile_img}
                  alt={chat.name || chat.username}
                  onError={(e) => {
                    e.target.src = assets.profile_img;
                  }}
                />
                <div className="friend-info">
                  <p className="friend-name">{chat.name || chat.username}</p>
                  <p className="friend-time">{chat.lastMessage || "No messages yet"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-chats">No existing chats</div>
          )
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
 