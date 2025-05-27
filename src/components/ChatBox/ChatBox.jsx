// import React, { useContext, useState } from 'react'
// import './ChatBox.css'
// import assets from '../../assets/assets';
// import { AppContext } from '../../context/AppContext';

// const ChatBox = () => {



//   const {userData, messageId, chatUser, messages, setMessages} = useContext(AppContext)
//   const [input, setInput] = useState("");

//   return  (
//     <div className='chat-box'>
//       <div className="chat-user">
//         <img src={assets.profile_img} alt="User profile" />
//         <p>Santu Kumar <img className='dot' src={assets.green_dot} alt="Online status" /></p>
//         <img src={assets.help_icon} alt="Help" className='help'/>
//       </div>

//       <div className='chat-msg'>
//         <div className="s-msg">
//           <p className='msg'>Hello, How are you?</p>
//           <div>
//             <img src={assets.profile_img} alt="" />
//             <p>2:30</p>
//           </div>
//         </div>
//         <div className="s-msg">
//           <img className='img-msg' src={assets.pic1} alt="" />
//           <div>
//             <img src={assets.profile_img} alt="" />
//             <p>2:30</p>
//           </div>
//         </div>
//         <div className="r-msg">
//           <p className='msg'>Hello, How are you?</p>
//           <div>
//             <img src={assets.profile_img} alt="" />
//             <p>2:30</p>
//           </div>
//         </div>

//       </div>
      
       
      
       
//       <div className="chat-input">
//         <input type="text" placeholder="Type a message..." />
//         <input type="file" id='image' accept='image/png, image/jpeg' hidden />
//         <label htmlFor="image">
//           <img src={assets.gallery_icon} alt="" />

//         </label>
//         <img src={assets.send_button} alt="" />
         
//       </div>
//     </div>
//   )
  
  
// }

// export default ChatBox;
 
 
import React, { useContext, useState } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const ChatBox = () => {
  const { userData, chatUser, messages, setMessages } = useContext(AppContext);
  const [input, setInput] = useState("");

  // If no chatUser is selected, show welcome screen
  if (!chatUser) {
    return (
      <div className='chat-welcome'>
        <h2>Welcome to XzalChat</h2>
        <p>Search for users to start chatting</p>
      </div>
    );
  }

  // If chatUser is selected, show chat interface
  return (
    <div className='chat-box'>
      <div className="chat-user">
        <img 
          src={chatUser.avatar || assets.Myphoto} 
          alt="User profile" 
          onError={(e) => { e.target.src = assets.profile_img; }}
        />
        <p>
          {chatUser.name || chatUser.username} 
          <img className='dot' src={assets.green_dot} alt="Online status" />
        </p>
        <img src={assets.help_icon} alt="Help" className='help'/>
      </div>

      <div className='chat-msg'>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            message.type === 'text' ? (
              <div 
                key={index} 
                className={message.senderId === userData.id ? 's-msg' : 'r-msg'}
              >
                <p className='msg'>{message.content}</p>
                <div>
                  <img 
                    src={message.senderId === userData.id ? 
                      (userData.avatar || assets.profile_img) : 
                      (chatUser.avatar || assets.profile_img)} 
                    alt="" 
                  />
                  <p>{message.timestamp}</p>
                </div>
              </div>
            ) : (
              <div 
                key={index} 
                className={message.senderId === userData.id ? 's-msg' : 'r-msg'}
              >
                <img className='img-msg' src={message.content} alt="" />
                <div>
                  <img 
                    src={message.senderId === userData.id ? 
                      (userData.avatar || assets.profile_img) : 
                      (chatUser.avatar || assets.profile_img)} 
                    alt="" 
                  />
                  <p>{message.timestamp}</p>
                </div>
              </div>
            )
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
        />
        <input type="file" id='image' accept='image/png, image/jpeg' hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img src={assets.send_button} alt="" />
      </div>
    </div>
  );
};

export default ChatBox;