import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';

/**
 * React 应用入口文件
 * 作用：
 * 1. 创建 React 根节点
 * 2. 应用 MUI 主题和 CSS 重置
 * 3. 渲染 App 根组件
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ThemeProvider: 提供 Material Design 3 主题 */}
    <ThemeProvider theme={theme}>
      {/* CssBaseline: 重置 CSS，确保跨浏览器一致性 */}
      <CssBaseline />
      {/* App: 应用根组件 */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
