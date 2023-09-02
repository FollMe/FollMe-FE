import { Paper, Typography, IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export function CommentInterface({ numsOfCmt, setOpenCmtDialog, isCmtLoading }) {
  numsOfCmt = 0
  return (
    <Paper variant="outlined" sx={{ borderRadius: '8px', p: '20px', mb: '30px' }}>
      <Typography gutterBottom variant="h4" component="div"
        sx={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'var(--text-color-title)',
        }}
      >
        Bình luận ({isCmtLoading ? "..." : numsOfCmt})
        <IconButton
          sx={{
            marginLeft: '14px',
            backgroundColor: '#e8e7e7',
            p: '10px',
            color: 'black'
          }}
          onClick={() => setOpenCmtDialog(true)}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
      </Typography>
      {
        !isCmtLoading
        && numsOfCmt === 0
        && <div style={{ textAlign: 'center', opacity: '0.7', marginTop: '10px' }}> Hãy là người đầu tiên chia sẻ cảm xúc của mình </div>
      }
    </Paper>
  )
}