export function waitConnectWS(socket) {
  return new Promise((res, rej) => {
    if (socket.readyState === socket.OPEN) {
      res()
    }
    if (socket.readyState === socket.CLOSED || socket.readyState === socket.CLOSING) {
      rej("Cannot connect WebSocket")
    }
    const onOpen = socket.onopen
    socket.onopen = () => {
      res()
      if (onOpen) {
        onOpen()
      }
    }

    const onError = socket.onerror
    socket.onerror = () => {
      res()
      if (onError) {
        onError()
      }
    }
  })
}
