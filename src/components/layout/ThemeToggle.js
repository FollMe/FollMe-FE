import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useColorMode } from 'customHooks/useColorMode';

export default function ThemeToggle() {
  const [mode, toggleMode] = useColorMode();
  const isDark = mode === 'dark';
  const label = isDark ? 'Chế độ sáng' : 'Chế độ tối';

  return (
    <Tooltip title={label}>
      <IconButton onClick={toggleMode} aria-label={label} sx={{ width: 40, height: 40, fontSize: 20 }}>
        {isDark ? <IoSunnyOutline /> : <IoMoonOutline />}
      </IconButton>
    </Tooltip>
  )
}
