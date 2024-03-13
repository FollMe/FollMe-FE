import { useState, useRef, createContext, useEffect } from "react";
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

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(new WebSocket(`${process.env.REACT_APP_WS_BASE_HOST}/comment-svc/ws`));
  const wsState = useRef({});
  const durationGenerator = useRef(exponentialBackoff());
  const needRecoverState = useRef(false);
  const handlersPool = useRef({});

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
        toast.warning(<ToastRefreshPageRequest />, {
          autoClose: 10000
        })
      }
      ws.send(JSON.stringify({
        action: "ping"
      }))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const isMatchedCommonAction = processCommonAction(ws, data);
      if (isMatchedCommonAction) {
        return;
      }
      if (handlersPool.current[data.action]) {
        handlersPool.current[data.action](data.message)
      }
    }
  
    return () => {
      clearTimeout(timeoutId);
    };
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
    try {
      await waitConnectWS();
      ws.send(JSON.stringify(body));
    } catch (err) {
      console.log(err);
    }

  }

  const addActions = (handlers) => {
    handlers.forEach(handler => {
      handlersPool.current[handler.action] = handler.do;
    })
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const isMatchedCommonAction = processCommonAction(ws, data);
      if (isMatchedCommonAction) {
        return;
      }
      if (handlersPool.current[data.action]) {
        handlersPool.current[data.action](data.message)
      }
    }
  }

  const removeActions = (actions) => {
    actions.forEach(action => {
      delete handlersPool.current[action];
    })
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const isMatchedCommonAction = processCommonAction(ws, data);
      if (isMatchedCommonAction) {
        return;
      }
      if (handlersPool.current[data.action]) {
        handlersPool.current[data.action](data.message)
      }
    }
  }

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
