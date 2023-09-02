import * as React from 'react';
import { Stack } from "@mui/system";
import { styled } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useUserInfo } from 'customHooks/useUserInfo';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';

const drawerBleeding = 0;

const Root = styled('div')(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'light' ? grey[100] : theme.palette.background.default,
}));

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : grey[800],
}));

function CommentMobile({ open, setOpen, comments, handlePosting, handleTyping, isPosting, isOtherTyping, isCmtLoading }) {
  const [userInfo] = useUserInfo();
  const bottomCommentListRef = React.useRef(null)
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const lastedCmt = comments[comments.length - 1];
    if (lastedCmt.new && lastedCmt.author.id === userInfo._id) {
      bottomCommentListRef.current?.scrollIntoView({ behavior: "smooth",  })
    }
  }, [comments])

  return (
    <Root>
      <SwipeableDrawer
        PaperProps={{
          sx: {
            height: '90%',
            overflow: 'visible',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10
          }
        }}
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <StyledBox
          sx={{
            px: 2,
            pb: 2,
            height: '100%',
            overflow: 'auto',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10
          }}
        >
          <Typography gutterBottom variant="h4" component="div"
            sx={{
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--text-color-title)',
              pt: 1.5,
              pb: 2,
              position: 'fixed',
              left: 0,
              width: '100%',
              zIndex: 9,
              backgroundColor: 'white',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10
            }}
          >
            Bình luận
          </Typography>
          <div style={{ height: '60px' }} />
          <CommentList
            comments={comments}
            isOtherTyping={isOtherTyping}
            isCmtLoading={isCmtLoading}
            handlePosting={handlePosting}
            isPosting={isPosting}
          />
          <div ref={bottomCommentListRef} style={{ height: '75px' }} />
          <Stack
            sx={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '100%',
              backgroundColor: 'white',
              padding: 2,
              borderTop: 'solid 1px rgb(230, 230, 230)'
            }}
          >
            <CommentInput onPost={handlePosting} onTyping={handleTyping} isPosting={isPosting} />
          </Stack>
        </StyledBox>
      </SwipeableDrawer>
    </Root>
  );
}

export default CommentMobile;
