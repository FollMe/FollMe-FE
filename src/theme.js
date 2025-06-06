import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    follme: {
      main: 'var(--theme-color)',
      contrastText: 'var(--theme-color)',
    },
  },
  components: {
    // Name of the component
    MuiButtonBase: {
      defaultProps: {
        // The props to change the default for.
        disableRipple: true, // No more ripple, on the whole application 💣!
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
        },
      }
    },
    MuiTypography: {
      styleOverrides: {
        // Name of the slot
        root: {
          // Some CSS
          fontSize: '1.5rem',
        },
        h4: {
          fontSize: '2.25rem'
        },
        h6: {
          fontSize: '2rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
        },
        outlined: {
          color: 'var(--theme-color)',
          border: '1px solid rgba(237 91 38 / 50%)',
          '&:hover': {
            border: '1px solid rgb(237 91 38)',
          }
        }
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem'
        }
      }
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--theme-color)',
          '&:hover': {
            backgroundColor: 'var(--theme-color)',
          },
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
        }
      }
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 0, 0, 0.87)',
        }
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        displayedRows: {
          fontSize: '1.2rem',
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1.5rem',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '1.2rem',
        }
      }
    }
  },
});
