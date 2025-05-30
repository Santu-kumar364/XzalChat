import React, { useContext } from "react";
import "./Chat.css";
 
import { AppContext } from "../../context/AppContext";
import LeftSideBar from "../../components/LeftSideBar/LeftSideBar";

import RightSideBar from "../../components/RighSideBar/RightSideBar";
 
import ChatBox from "../../components/ChatBox/ChatBox";

const Chat = () => {
  const { chatDisplay, isMobile, rightSidebarVisible } = useContext(AppContext);

  return (
    <div className="chat">
      <div className="chat-container">
        {(!isMobile || !chatDisplay) && <LeftSideBar />}
        {(!isMobile || chatDisplay) && <ChatBox />}
        {(!isMobile || rightSidebarVisible)  && <RightSideBar />}
        
      </div>
    </div>
  );
};

export default Chat;