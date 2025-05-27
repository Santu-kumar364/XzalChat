import React from 'react'
import './RightSideBar.css'
import assets from '../../assets/assets'
import { logout } from '../../config/firebase'
 

const RightSideBar = () => {
  return (
    <div className='rs'>
      <div className="rs-profile">
        <img src={assets.Myphoto} alt="Profile" />
        <h3>Santu Kumar <img src={assets.green_dot} className='dot' alt="Online status" /></h3>
        <p>Hey, There Santu Gupta</p>
      </div>
      <hr className="divider"/>
      <div className="rs-media">
        <p className="media-title">Media</p>
        <div className="media-grid">
          <img src={assets.pic1} alt="Media 1" />
          <img src={assets.pic1} alt="Media 2" />
          <img src={assets.pic1} alt="Media 3" />
          <img src={assets.pic1} alt="Media 4" />
          <img src={assets.pic1} alt="Media 5" />
          <img src={assets.pic1} alt="Media 6" />
        </div>
      </div>
      <button onClick={()=>logout()}  className="logout-btn">Logout</button>
    </div>
  )
}

export default RightSideBar