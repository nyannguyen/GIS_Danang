import React, { useEffect, useState } from 'react';
import { Menu, Dropdown, Badge, Avatar, List, Button } from 'antd';
import { 
  MailOutlined, 
  BellOutlined, 
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import Flex from 'components/shared-components/Flex'
import { useSelector } from 'react-redux';
import { db } from 'auth/FirebaseAuth';
import moment from "moment";

const getNotificationBody = list => {
  return list.length > 0 ?
  <List
    size="small"
    itemLayout="horizontal"
    dataSource={list}
    renderItem={item => (
      <List.Item className="list-clickable">
        <Flex alignItems="center">
          <div className="mr-3">
            <span className="font-weight-bold text-dark">{item.message} </span>
          </div>
          <small className="ml-auto">{moment(item.createdAt.toDate()).format("DD-MM-YYYY HH:mm")}</small>
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

export const NavNotification = () => {

  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([])
  const [user] = useState(useSelector(state=>state.auth));

  const handleVisibleChange = (flag) => {
    if(flag===false){
      db.collection("notifications").where("requestOwnerId","==", user.token ).get().then(notifications => {
        notifications.forEach(notification => {
          notification.ref.delete();
        })
      })
    }
    setVisible(flag);
  }

  const notificationList = (
    <div className="nav-dropdown nav-notification">
      <div className="nav-notification-header d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Thông báo</h4>
        <Button type="link" onClick={() => handleVisibleChange(false)} size="small">Xóa </Button>
      </div>
      <div className="nav-notification-body">
        {getNotificationBody(data)}
      </div>
      {/* {
        data.length > 0 ? 
        <div className="nav-notification-footer">
          <a className="d-block" href="#/">View all</a>
        </div>
        :
        null
      } */}
    </div>
  );

  useEffect(() => {
    if(user.token) {
      db.collection("notifications").where("requestOwnerId","==", user.token ).onSnapshot(notifications => { 
        setData(notifications.docs.map(notification => notification.data()));
      })
    }
  },[user.token])

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
            <BellOutlined className="nav-icon mx-auto" type="bell" />
          </Badge>
        </Menu.Item>
      </Menu>
    </Dropdown>
  )
}


export default NavNotification;
