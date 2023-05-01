import { useState, createContext } from "react";

const WebSocketContext = createContext();


const WebSocketProvider = ({ children }) => {
  const socket = new WebSocket(`${process.env.REACT_APP_WS_BASE_HOST}/comment-svc/ws`);
  const [ws, setWs] = useState(socket);

  return (
    <WebSocketContext.Provider value={{ ws, setWs }} >
      {children}
    </WebSocketContext.Provider>
  )
}

export { WebSocketContext, WebSocketProvider };
