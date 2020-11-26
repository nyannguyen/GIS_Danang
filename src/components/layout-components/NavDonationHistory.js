import React, { useEffect, useState } from 'react';
import { Menu, Dropdown, Badge, Avatar, List, Button } from 'antd';
import { 
  MailOutlined, 
  GiftOutlined, 
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import Flex from 'components/shared-components/Flex'
import { useSelector } from 'react-redux';
import { db } from 'auth/FirebaseAuth';

const getIcon =  icon => {
  switch (icon) {
    case 'mail':
      return <MailOutlined />;
    case 'alert':
      return <WarningOutlined />;
    case 'check':
      return <CheckCircleOutlined />
    default:
      return <MailOutlined />;
  }
}

const getNotificationBody = list => {
  return list.length > 0 ?
  <List
    size="small"
    itemLayout="horizontal"
    dataSource={list}
    renderItem={item => (
      <List.Item className="list-clickable">
        <Flex alignItems="center">
          <div className="pr-3">
            {item.img? <Avatar src={`/img/avatars/${item.img}`} /> : <Avatar className={`ant-avatar-${item.type}`} icon={getIcon(item.icon)} />}
          </div>
          <div className="mr-3">
            <span className="font-weight-bold text-dark">{item.name} </span>
            <span className="text-gray-light">{item.desc}</span>
          </div>
          <small className="ml-auto">{item.time}</small>
        </Flex>
      </List.Item>
    )}
  />
  :
  <div className="empty-notification">
    <img src="https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg" alt="empty" />
    <p className="mt-3">You have viewed all notifications</p>
  </div>;
}

export const NavDonationHistory = () => {

  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([])

  const handleVisibleChange = (flag) => {
    setVisible(flag);
  }

  const [user] = useState(useSelector(state=>state.auth));
  
  const [donationHistory, setDonationHistory] = useState([]);

  useEffect(() => {
    if(user.token) {
      db.collection("sos-requests").where("donators","array-contains", user.token ).onSnapshot(donations => { 
        setDonationHistory([]);
        donations.forEach(donation => {
          setDonationHistory(oldValues => [...oldValues,{id: donation.id, ...donation.data()}]);
        })
      })
    }
  },[user.token])

  const notificationList = (
    <div className="nav-dropdown nav-notification">
      <div className="nav-notification-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Notification</h4>
        <Button type="link" onClick={() => setData([])} size="small">Clear </Button>
      </div>
      <div className="nav-notification-body">
        {getNotificationBody(data)}
      </div>
      {
        data.length > 0 ? 
        <div className="nav-notification-footer">
          <a className="d-block" href="#/">View all</a>
        </div>
        :
        null
      }
    </div>
  );

  return (
    <Dropdown 
      placement="bottomRight"
      overlay={notificationList}
      onVisibleChange={handleVisibleChange}
      visible={visible}
      trigger={['click']}
    >
      <Menu mode="horizontal">
        <Menu.Item>
          <Badge count={data.length}>
            <GiftOutlined className="nav-icon mx-auto" type="bell" />
          </Badge>
        </Menu.Item>
      </Menu>
    </Dropdown>
  )
}


export default NavDonationHistory;
