import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ColorModeProvider, UserInfoProvider, WebSocketProvider } from './contexts';
import ErrorBoundary from 'components/error/ErrorBoundary';
import { installErrorReporting } from 'util/errorReporter';

installErrorReporting();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ColorModeProvider>
      <UserInfoProvider>
        <WebSocketProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </WebSocketProvider>
      </UserInfoProvider>
    </ColorModeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
