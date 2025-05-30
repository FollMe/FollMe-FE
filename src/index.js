import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import ReactDOM from 'react-dom/client';
import './index.css';
import './Base.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserInfoProvider, WebSocketProvider } from './contexts';
import { theme } from 'theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
        <ThemeProvider theme={theme}>
            <UserInfoProvider>
              <WebSocketProvider>
                <App />
              </WebSocketProvider>
            </UserInfoProvider>
        </ThemeProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
