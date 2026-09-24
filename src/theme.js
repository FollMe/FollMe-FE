import { createTheme, alpha } from '@mui/material/styles';

// Keep in sync with the tokens in index.css
const tokens = {
  light: {
    brand: '#ea580c',
    brandHover: '#c2410c',
    bg: '#faf8f5',
    surface: '#ffffff',
    surface2: '#f4f1ec',
    border: '#e8e2d9',
    text: '#1c1917',
    text2: '#57534e',
    text3: '#8a837a',
  },
  dark: {
    brand: '#f26b2c',
    brandHover: '#ff8446',
    bg: '#111010',
    surface: '#1a1817',
    surface2: '#232120',
    border: '#2e2b29',
    text: '#eeeae4',
    text2: '#b8b0a6',
    text3: '#877f76',
  },
};

const fontSans = "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const fontSerif = "'Lora', Georgia, 'Times New Roman', serif";

export function getTheme(mode = 'light') {
  const t = tokens[mode] ?? tokens.light;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.brand,
        dark: t.brandHover,
        contrastText: '#fff',
      },
      follme: {
        main: t.brand,
        contrastText: '#fff',
      },
      background: {
        default: t.bg,
        paper: t.surface,
      },
      text: {
        primary: t.text,
        secondary: t.text2,
        disabled: t.text3,
      },
      divider: t.border,
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      // html font-size is 62.5% (1rem = 10px)
      htmlFontSize: 10,
      fontFamily: fontSans,
      h1: { fontFamily: fontSerif, fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: fontSerif, fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontFamily: fontSerif, fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontSize: '1.45rem',
            padding: '8px 18px',
            transition: 'background-color .2s, border-color .2s, color .2s, box-shadow .2s, transform .2s',
          },
          sizeLarge: {
            fontSize: '1.55rem',
            padding: '11px 24px',
          },
          sizeSmall: {
            fontSize: '1.3rem',
            padding: '5px 12px',
          },
          outlined: {
            borderColor: t.border,
            color: t.text,
            backgroundColor: t.surface,
            '&:hover': {
              borderColor: t.text3,
              backgroundColor: t.surface2,
            },
          },
          text: {
            color: t.text2,
            '&:hover': {
              backgroundColor: t.surface2,
              color: t.text,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: t.text2,
            '&:hover': {
              backgroundColor: t.surface2,
              color: t.text,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: t.border,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: `1px solid ${t.border}`,
            boxShadow: mode === 'dark'
              ? '0 16px 40px -12px rgba(0,0,0,.7)'
              : '0 16px 40px -12px rgba(28,25,23,.2)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '1.45rem',
            borderRadius: 8,
            margin: '0 6px',
            padding: '8px 12px',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '1.25rem',
            fontWeight: 500,
            backgroundColor: mode === 'dark' ? '#3a3633' : '#1c1917',
            borderRadius: 8,
            padding: '6px 10px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: mode === 'dark' ? `1px solid ${t.border}` : 'none',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.8rem',
            fontWeight: 700,
          },
        },
      },
      MuiDialogContentText: {
        styleOverrides: {
          root: {
            color: t.text,
            fontSize: '1.55rem',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontSize: '1.5rem',
            borderRadius: 12,
            backgroundColor: t.surface,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: t.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: t.text3,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: t.brand,
              borderWidth: 1,
              boxShadow: `0 0 0 3px ${alpha(t.brand, 0.2)}`,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '1.5rem',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: '1.25rem',
            marginLeft: 4,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '1.25rem',
            fontWeight: 500,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            fontSize: '1.35rem',
            fontWeight: 600,
            textTransform: 'none',
            border: 0,
            borderRadius: '999px !important',
            padding: '6px 14px',
            color: t.text2,
            '&.Mui-selected': {
              backgroundColor: t.surface,
              color: t.text,
              boxShadow: mode === 'dark'
                ? '0 1px 2px rgba(0,0,0,.5)'
                : '0 1px 2px rgba(28,25,23,.12)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: t.surface,
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: t.surface2,
            borderRadius: 999,
            padding: 4,
            gap: 2,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(28,25,23,.07)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            fontSize: '1.45rem',
            borderColor: t.border,
            borderRadius: 14,
            backgroundColor: t.surface,
          },
          columnHeaders: {
            backgroundColor: t.surface2,
            borderColor: t.border,
          },
          cell: {
            borderColor: t.border,
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          displayedRows: {
            fontSize: '1.3rem',
          },
        },
      },
    },
  });
}
