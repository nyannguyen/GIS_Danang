import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import Loading from 'components/shared-components/Loading';

export const AppViews = ({match}) => {
  return (
    <Suspense fallback={<Loading cover="content"/>}>
      <Switch>
        <Route path={`${match.url}/plan/:planId`} component={lazy(() => import(`./summary`))} />
        <Route path={`${match.url}/home`} component={lazy(() => import(`./home`))} />
        <Redirect from={`${match.url}`} to={`${match.url}/home`} />
      </Switch>
    </Suspense>
  )
}

export default AppViews;
