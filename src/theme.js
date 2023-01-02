import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    components: {
        // Name of the component
        MuiButtonBase: {
            defaultProps: {
                // The props to change the default for.
                disableRipple: true, // No more ripple, on the whole application 💣!
            },
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
        }
    },
});
