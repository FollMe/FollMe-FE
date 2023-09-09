import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useUserInfo } from 'customHooks/useUserInfo';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { handleCheckLoggedIn } from "util/authHelper";

export function CommentDesktop({ open, setOpen, comments, handlePosting, isPosting, isCmtLoading, isOtherTyping }) {
  const [userInfo] = useUserInfo();
  const bottomCommentListRef = React.useRef(null)
  const isLoggedIn = React.useMemo(
    () => handleCheckLoggedIn(userInfo.sessionExp)
    , [userInfo]
  )

  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const lastedCmt = comments[comments.length - 1];
    if (lastedCmt.new && lastedCmt.author.id === userInfo._id) {
      bottomCommentListRef.current?.scrollIntoView({ behavior: "smooth" })
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
          <CommentList
            comments={comments}
            isCmtLoading={isCmtLoading}
            handlePosting={handlePosting}
            isPosting={isPosting}
            isLoggedIn={isLoggedIn}
          />
          <div ref={bottomCommentListRef} />
        </DialogContent>
        <DialogActions sx={{ p: '20px' }}>
          <CommentInput
            onPost={handlePosting}
            isPosting={isPosting}
            isOtherTyping={isOtherTyping}
            isLoggedIn={isLoggedIn}
          />
        </DialogActions>
      </Dialog>
    </div>
  );
}