import React, { useContext } from "react";
import "./Chat.css";
import LeftSideBar from "../../components/LeftSideBar/LeftSideBar";
import RightSideBar from "../../components/RighSideBar/RightSideBar";
import ChatBox from "../../components/ChatBox/ChatBox";

const Chat = () => {
  return (
    <div className="chat">
      <div className="chat-container">
        <LeftSideBar />
        <ChatBox />
        <RightSideBar />
      </div>
    </div>
  );
};

export default Chat;


 