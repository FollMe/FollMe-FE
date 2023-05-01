import { useContext } from 'react';
import { WebSocketContext } from '../contexts';

function useWebSocket() {
    const { ws, setWs } = useContext(WebSocketContext);
    return [ ws, setWs ];
}

export { useWebSocket }
