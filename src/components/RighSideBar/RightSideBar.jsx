 

// import React, { useContext } from "react";
// import "./RightSideBar.css";
// import assets from "../../assets/assets";
// import { logout } from "../../config/firebase";
// import { AppContext } from "../../context/AppContext";

// const RightSideBar = () => {
//   const { chatUser } = useContext(AppContext);

   
//   const userAvatar = chatUser?.avatar || " ";
//   const userName = chatUser?.name || "Unknown User";
//   const userBio = chatUser?.bio || "Hey there! I am using XzalChat";

//   return chatUser ? (
//     <div className="rs">
//       <div className="rs-profile">
//         <img
//           src={userAvatar}
//           alt="Profile"
//           onError={(e) => (e.target.src = assets.defaultAvatar)}
//         />
//         <h3>
//           {userName}
//           <img src={assets.green_dot} className="dot" alt="Online status" />
//         </h3>
//         <p>{userBio}</p>
//       </div>
//       <hr className="divider" />
//       <div className="rs-media">
//         <p className="media-title">Media</p>
//         <div className="media-grid">
//           {[1, 2, 3, 4, 5, 6].map((num) => (
//             <img
//               key={num}
//               src={assets[`pic${num}`] || assets.defaultMedia}
//               alt={`Media ${num}`}
//             />
//           ))}
//         </div>
//       </div>
//       <button onClick={logout} className="logout-btn">
//         Logout
//       </button>
//     </div>
//   ) : (
//     <div className="rs">
//       <button onClick={logout} className="logout-btn">
//         Logout
//       </button>
//     </div>
//   );
// };

// export default RightSideBar;



 
import React, { useContext, useEffect, useState } from "react";
import "./RightSideBar.css";
import assets from "../../assets/assets";
import { logout } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";

const RightSideBar = () => {
  const { chatUser, messages } = useContext(AppContext); 
  const [msgPhotos, setMsgPhotos] = useState([]);

  useEffect(() => {
    // Extract all image URLs from messages
    const photos = messages
      .filter(msg => msg.content?.imageUrl) // Filter messages with images
      .map(msg => msg.content.imageUrl);   // Extract image URLs
    
    setMsgPhotos(photos);
  }, [messages]);

  const userAvatar = chatUser?.avatar || assets.defaultAvatar;
  const userName = chatUser?.name || "Unknown User";
  const userBio = chatUser?.bio || "Hey there! I am using XzalChat";

  return chatUser ? (
    <div className="rs">
      <div className="rs-profile">
        <img
          src={userAvatar}
          alt="Profile"
          onError={(e) => (e.target.src = assets.defaultAvatar)}
        />
        <h3>
          {userName}
          <img src={assets.green_dot} className="dot" alt="Online status" />
        </h3>
        <p>{userBio}</p>
      </div>
      <hr className="divider" />
      <div className="rs-media">
        <p className="media-title">Media</p>
        <div className="media-grid">
          {msgPhotos.length > 0 ? (
            msgPhotos.map((url, index) => (
              <img key={index} src={url} alt={`Media ${index}`} className="media-thumbnail" />
            ))
          ) : (
            <p className="no-media">No shared media yet</p>
          )}
        </div>
      </div>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  ) : (
    <div className="rs">
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default RightSideBar;