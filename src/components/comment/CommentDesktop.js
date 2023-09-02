import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useUserInfo } from 'customHooks/useUserInfo';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';

export function CommentDesktop({ open, setOpen, comments, handlePosting, handleTyping, isPosting, isCmtLoading, isOtherTyping }) {
  const [userInfo] = useUserInfo();
  const bottomCommentListRef = React.useRef(null)
  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const lastedCmt = comments[comments.length - 1];
    if (lastedCmt.new && (lastedCmt.author.id === userInfo._id || lastedCmt.author._id === userInfo._id)) {
      bottomCommentListRef.current?.scrollIntoView({ behavior: "smooth",  })
    }
  }, [comments])

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll='paper'
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        maxWidth='md'
        fullWidth
      >
        <DialogTitle id="scroll-dialog-title"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-color-title)',
          }}
        >
          Bình luận
        </DialogTitle>
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
        <DialogContent dividers>
          <DialogContentText
            id="scroll-dialog-description"
            tabIndex={-1}
          >
            <CommentList
              comments={comments}
              isOtherTyping={isOtherTyping}
              isCmtLoading={isCmtLoading}
              handlePosting={handlePosting}
              isPosting={isPosting}
            />
            <div ref={bottomCommentListRef} />
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: '20px' }}>
          <CommentInput onPost={handlePosting} onTyping={handleTyping} isPosting={isPosting} />
        </DialogActions>
      </Dialog>
    </div>
  );
}