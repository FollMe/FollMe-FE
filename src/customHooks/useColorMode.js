import { useContext } from 'react';
import { ColorModeContext } from '../contexts';

function useColorMode() {
    const { mode, toggleMode } = useContext(ColorModeContext);
    return [ mode, toggleMode ];
}

export { useColorMode }
