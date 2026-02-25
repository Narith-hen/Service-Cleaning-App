import React, { createContext, useContext, useState } from 'react';
import { message as antMessage } from 'antd';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [messageApi, contextHolder] = antMessage.useMessage();

  const showNotification = (type, content, duration = 3) => {
    messageApi.open({
      type,
      content,
      duration,
    });
  };

  const success = (content) => showNotification('success', content);
  const error = (content) => showNotification('error', content);
  const warning = (content) => showNotification('warning', content);
  const info = (content) => showNotification('info', content);

  const value = {
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};