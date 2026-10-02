import { useState, useRef, createContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

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

const WS_URL = `${process.env.REACT_APP_WS_BASE_HOST}/comment-svc/ws`;

/** Resolves once the socket is open (at once if it already is). */
function whenOpen(socket) {
  if (socket.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
    return Promise.reject(new Error("Cannot connect WebSocket"));
  }
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("Cannot connect WebSocket")), { once: true });
  });
}

/**
 * The connection to the comment service, for live comments and
 * notifications. Opened on first use, not on every page: wedding guests
 * and the venue screen never need it.
 */
const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const wsState = useRef({});
  const durationGenerator = useRef(exponentialBackoff());
  const needRecoverState = useRef(false);
  const handlersPool = useRef({});
  const retryTimer = useRef(null);
  const openRef = useRef(null);

  // Handlers are set as soon as the socket exists, so "authenticate" is
  // always the first message, before anything a page sends.
  openRef.current = () => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      // Reset exponential backoff
      durationGenerator.current = exponentialBackoff();

      socket.send(JSON.stringify({
        action: "authenticate",
        message: process.env.REACT_APP_WS_TOKEN
      }))

      // Recover current state to server
      if (needRecoverState.current && Object.keys(wsState.current).length > 0) {
        socket.send(JSON.stringify({
          action: "recover_state",
          message: JSON.stringify(wsState.current)
        }))
        toast.warning(<ToastRefreshPageRequest />, {
          autoClose: 10000
        })
      }
      socket.send(JSON.stringify({
        action: "ping"
      }))
    };

    socket.onclose = () => {
      needRecoverState.current = true;
      retryTimer.current = setTimeout(() => openRef.current(), durationGenerator.current.next().value);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const isMatchedCommonAction = processCommonAction(socket, data);
      if (isMatchedCommonAction) {
        return;
      }
      if (handlersPool.current[data.action]) {
        handlersPool.current[data.action](data.message)
      }
    };

    setWs(socket);
    return socket;
  };

  useEffect(() => () => clearTimeout(retryTimer.current), []);

  // A new function after each reconnect, so pages that send in an effect
  // (join a post...) send again on the new connection.
  const wsSend = useCallback(async (body) => {
    wsState.current[body.action] = body.message;
    try {
      const socket = wsRef.current ?? openRef.current();
      await whenOpen(socket);
      socket.send(JSON.stringify(body));
    } catch (err) {
      console.log(err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws]);

  const addActions = useCallback((handlers) => {
    handlers.forEach(handler => {
      handlersPool.current[handler.action] = handler.do;
    })
  }, []);

  const removeActions = useCallback((actions) => {
    actions.forEach(action => {
      delete handlersPool.current[action];
    })
  }, []);

  return (
    <WebSocketContext.Provider value={{ wsSend, addActions, removeActions }} >
      {children}
    </WebSocketContext.Provider>
  )
}

const processCommonAction = (ws, data) => {
  switch (data.action) {
    case "ping":
      ws.send(JSON.stringify({
        action: "pong"
      }))
      break;
    default:
      return false
  }
  return true;
}

export { WebSocketContext, WebSocketProvider };

const ToastRefreshPageRequest = () => {
  return (
    <p>Lỗi kết nối máy chủ. Vui lòng&nbsp;
      <a href="." onClick={(e) => {
        e.preventDefault();
        window.location.reload()
      }}
      >
        tải lại
      </a>!
    </p>
  )
}
