import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Slide from '@mui/material/Slide';
import { forceLogin } from 'util/authHelper';
import Locked from 'components/animations/Locked';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function RequestSignInDialog({ open, setOpen, action }) {
  const navigate = useNavigate();
  const handleClose = () => {
    setOpen(false);
  };
  function handleSignIn() {
    forceLogin();
    navigate('/sign-in');
  }

  return (
    <div>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        maxWidth='sm'
        fullWidth
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            Vui lòng đăng nhập để <b> {action} </b>
          </DialogContentText>
          <Locked styles={{
            margin: '5px auto',
            marginBottom: '0px',
            width: 200,
            opacity: 0.7
          }} />
        </DialogContent>
        <DialogActions>
          <Button variant='text' onClick={handleClose} sx={{
            textTransform: 'none',
            color: 'var(--text-color-title)',
            mr: '10px'
          }}>
            Hủy
          </Button>
          <Button
            startIcon={<LockOpenIcon />}
            variant="contained"
            sx={{
              backgroundColor: 'var(--theme-color)',
              textTransform: 'none',
              fontSize: '1.2rem',
            }}
            onClick={handleSignIn}
          >
            Đăng nhập
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}