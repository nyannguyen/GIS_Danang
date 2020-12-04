import React, { useState } from "react";
import { connect } from "react-redux";
import { Menu, Layout } from "antd";
import {  MenuUnfoldOutlined, SearchOutlined } from '@ant-design/icons';
import NavNotification from './NavNotification';
import NavProfile from './NavProfile';
import NavSearch  from './NavSearch';
import SearchInput from './NavSearch/SearchInput.js'
import { toggleCollapsedNav, onMobileNavToggle } from 'redux/actions/Theme';
import { NAV_TYPE_TOP } from 'constants/ThemeConstant';
import utils from 'utils'
import NavDonationHistory from "./NavDonationHistory";

const { Header } = Layout;

export const HeaderNav = props => {
  const { navCollapsed, mobileNav, navType, headerNavColor, toggleCollapsedNav, onMobileNavToggle, isMobile } = props;
  const [searchActive, setSearchActive] = useState(false)

  const onSearchActive = () => {
    setSearchActive(true)
  }

  const onSearchClose = () => {
    setSearchActive(false)
  }

  const onToggle = () => {
    if(!isMobile) {
      toggleCollapsedNav(!navCollapsed)
    } else {
      onMobileNavToggle(!mobileNav)
    }
  }

  const isNavTop = navType === NAV_TYPE_TOP ? true : false
  const mode = utils.getColorContrast(headerNavColor)
  return (
    <Header className={`app-header ${mode}`} style={{backgroundColor: headerNavColor}}>
      <div className={`app-header-wrapper ${isNavTop ? 'layout-top-nav' : ''}`}>
        <div className="nav" style={{width: `100%`}}>
          <div className="nav-left">
            <Menu mode="horizontal">
                <Menu.Item key="0" onClick={() => {onToggle()}}>
                  <MenuUnfoldOutlined className="nav-icon" />
                </Menu.Item>
            </Menu>
          </div>
          <div className="nav-right">
            <NavNotification />
            <NavProfile />
          </div>
          <NavSearch active={searchActive} close={onSearchClose}/>
        </div>
      </div>
    </Header>
  )
}

const mapStateToProps = ({ theme }) => {
  const { navCollapsed, navType, headerNavColor, mobileNav } =  theme;
  return { navCollapsed, navType, headerNavColor, mobileNav }
};

export default connect(mapStateToProps, {toggleCollapsedNav, onMobileNavToggle})(HeaderNav);