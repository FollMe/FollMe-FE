import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogContentText from '@mui/material/DialogContentText';
import QRCode from 'react-qr-code';
import styles from './QRModel.module.scss'

export default function QRModel({
  value,
  handleClose
}) {
  return (
    <div>
      <Dialog
        open={true}
        onClose={handleClose}
      >
        <DialogTitle></DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent>
          <div className={styles.qrContainer}>
            <QRCode
              title="FollMe.eCard"
              value={value}
              fgColor='#ff6541'
              size='100%'
            />
          </div>
          <DialogContentText>
            Vui lòng đưa mã này cho <b>Ban Tổ Chức</b>!
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}
