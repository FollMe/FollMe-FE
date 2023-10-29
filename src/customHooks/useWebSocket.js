import { useContext } from 'react';
import { WebSocketContext } from '../contexts';

function useWebSocket() {
  const { wsSend, addActions, removeActions } = useContext(WebSocketContext);
  return { wsSend, addActions, removeActions };
}

export { useWebSocket }
