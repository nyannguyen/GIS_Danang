import { 
  CompassOutlined
} from '@ant-design/icons';

const dashBoardNavTree = [{
  key: 'home',
  path: '/app/home',
  title: 'Map View',
  icon: CompassOutlined,
  breadcrumb: false,
  submenu: []
}]

const navigationConfig = [
  ...dashBoardNavTree
]

export default navigationConfig;
