import { useState, useRef, createContext, useEffect } from "react";

const WebSocketContext = createContext();

function* exponentialBackoff() {
  let duration = 2000
  while (duration < 300000) {
    yield duration;
    duration *= 2;
  }
  while (true) {
    yield duration
  }
}

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(new WebSocket(`${process.env.REACT_APP_WS_BASE_HOST}/comment-svc/ws`));
  const wsState = useRef({});
  const durationGenerator = useRef(exponentialBackoff());
  const needRecoverState = useRef(false);

  useEffect(() => {
    const onClose = ws.onclose;
    let timeoutId;
    ws.onclose = function () {
      needRecoverState.current = true;
      timeoutId = setTimeout(function () {
        setWs(new WebSocket(`${process.env.REACT_APP_WS_BASE_HOST}/comment-svc/ws`))
      }, durationGenerator.current.next().value);
      if (onClose) {
        onClose()
      }
    };

    const onOpen = ws.onopen
    ws.onopen = function () {
      if (onOpen) {
        onOpen();
      }

      // Reset exponential backoff
      durationGenerator.current = exponentialBackoff();
      
      // Recover current state to server
      if (needRecoverState.current && Object.keys(wsState.current).length > 0) {
        ws.send(JSON.stringify({
          action: "recover_state",
          message: JSON.stringify(wsState.current)
        }))
      }
    }

    return () => clearTimeout(timeoutId);
  }, [ws])

  const waitConnectWS = () => {
    return new Promise((res, rej) => {
      if (ws.readyState === ws.OPEN) {
        res()
      }
      if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
        rej("Cannot connect WebSocket")
      }
      const onOpen = ws.onopen
      ws.onopen = () => {
        res()
        if (onOpen) {
          onOpen()
        }
      }

      const onError = ws.onerror
      ws.onerror = () => {
        res()
        if (onError) {
          onError()
        }
      }
    })
  }

  const wsSend = async (body) => {
    wsState.current[body.action] = body.message;
    await waitConnectWS();
    ws.send(JSON.stringify(body))
  }

  return (
    <WebSocketContext.Provider value={{ wsSend, ws }} >
      {children}
    </WebSocketContext.Provider>
  )
}

export { WebSocketContext, WebSocketProvider };
