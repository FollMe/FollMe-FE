import { useContext } from 'react';
import { WebSocketContext } from '../contexts';

function useWebSocket() {
    const { wsSend, ws } = useContext(WebSocketContext);
    return [ wsSend, ws ];
}

export { useWebSocket }
