import React from 'react';
import { Layout } from 'antd';
import { Switch, Route, withRouter } from "react-router-dom";
import { connect } from 'react-redux';
import TopNav from 'components/layout-components/TopNav';
import MobileNav from 'components/layout-components/MobileNav'
import HeaderNav from 'components/layout-components/HeaderNav';
import PageHeader from 'components/layout-components/PageHeader';
import AppViews from 'views/app-views';
import navigationConfig from "configs/NavigationConfig";
import { 
  SIDE_NAV_WIDTH, 
  SIDE_NAV_COLLAPSED_WIDTH,
  NAV_TYPE_TOP
} from 'constants/ThemeConstant';
import utils from 'utils';

const { Content } = Layout;

export const AppLayout = ({ navCollapsed, navType, location }) => {
  const currentRouteInfo = utils.getRouteInfo(navigationConfig, location.pathname)
  const isMobile = true
  const isNavTop = navType === NAV_TYPE_TOP
  const getLayoutGutter = () => {
    if(isNavTop || isMobile) {
      return 0
    }
    return navCollapsed ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_WIDTH
  }
  return (
    <Layout>
      <HeaderNav isMobile={isMobile}/>
      {(isNavTop && !isMobile) ? <TopNav routeInfo={currentRouteInfo}/> : null}
      <Layout className="app-container">
        <Layout className="app-layout" style={{paddingLeft: getLayoutGutter()}}>
          <div className={`app-content ${isNavTop ? 'layout-top-nav' : ''}`}>
            <PageHeader display={currentRouteInfo?.breadcrumb} title={currentRouteInfo?.title} />
            <Content>
              <Switch>
                <Route path="" component={AppViews} />
              </Switch>
            </Content>
          </div>
        </Layout>
      </Layout>
      <MobileNav />
    </Layout>
  )
}

const mapStateToProps = ({ theme }) => {
  const { navCollapsed, navType, locale } =  theme;
  return { navCollapsed, navType, locale }
};

export default withRouter(connect(mapStateToProps)(AppLayout));