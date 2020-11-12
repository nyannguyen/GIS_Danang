import React, { useEffect, useState } from "react";
import { Menu, Dropdown, Avatar } from "antd";
import { connect } from 'react-redux'
import { 
  EditOutlined, 
  LogoutOutlined 
} from '@ant-design/icons';
import Icon from 'components/util-components/Icon';
import { signOut } from 'redux/actions/Auth';
import {auth} from 'auth/FirebaseAuth';

const menuItem = [
	{
		title: "Edit Profile",
		icon: EditOutlined ,
		path: "/"
    },
]

export const NavProfile = ({signOut}) => {
  const [currentUser, setCurrentUser] = useState();

  useEffect(()=> {
    auth.onAuthStateChanged((user) => {
      if(user){
        setCurrentUser(user);
      }
    })
  })
  const profileImg = "/img/avatars/thumb-1.jpg";
  const profileMenu = (
    <div className="nav-profile nav-dropdown">
      <div className="nav-profile-header">
        <div className="d-flex">
          <div className="pl-3">
            <h4 className="mb-0">{currentUser?.displayName}</h4>
            <span className="text-muted">{currentUser?.email}</span>
          </div>
        </div>
      </div>
      <div className="nav-profile-body">
        <Menu>
          {menuItem.map((el, i) => {
            return (
              <Menu.Item key={i}>
                <a href={el.path}>
                  <Icon className="mr-3" type={el.icon} />
                  <span className="font-weight-normal">{el.title}</span>
                </a>
              </Menu.Item>
            );
          })}
          <Menu.Item key={menuItem.legth + 1} onClick={e => signOut()}>
            <span>
              <LogoutOutlined className="mr-3"/>
              <span className="font-weight-normal">Sign Out</span>
            </span>
          </Menu.Item>
        </Menu>
      </div>
    </div>
  );
  return (
    <Dropdown placement="bottomRight" overlay={profileMenu} trigger={["click"]}>
      <Menu className="d-flex align-item-center" mode="horizontal">
        <Menu.Item>
          <Avatar src={profileImg} />
        </Menu.Item>
      </Menu>
    </Dropdown>
  );
}

export default connect(null, {signOut})(NavProfile)
