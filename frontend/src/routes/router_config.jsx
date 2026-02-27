import React from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './route.jsx';

const RouterConfig = () => {
  const element = useRoutes(routes);
  return element;
};

export default RouterConfig;