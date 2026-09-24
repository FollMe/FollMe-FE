import { useState, useEffect, useMemo, createContext } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from "theme";

const STORAGE_KEY = 'color-mode';

const ColorModeContext = createContext();

function getInitialMode() {
  // index.html resolves the saved / system preference before first paint
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);
  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        // Storage can be unavailable (private mode); the toggle still works for this visit
      }
      return next;
    });
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export { ColorModeContext, ColorModeProvider };
