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
import { handleCheckLoggedIn } from "util/authHelper";

const drawerBleeding = 0;

const Root = styled('div')(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'light' ? grey[100] : theme.palette.background.default,
}));

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : grey[800],
}));

function CommentMobile({ open, setOpen, comments, handlePosting, isPosting, isOtherTyping, isCmtLoading }) {
  const [userInfo] = useUserInfo();
  const bottomCommentListRef = React.useRef(null)
  const isLoggedIn = React.useMemo(
    () => handleCheckLoggedIn(userInfo.sessionExp)
    , [userInfo]
  )
  const [inputCtnHeight, setInputCtnHeight] = React.useState(75);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };


  React.useEffect(() => {
    if (window.location.search.includes("show_comments=true") && !open) {
      window.history.replaceState({}, document.title, window.location.href.split("?")[0]);
    }
  }, [])

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const lastedCmt = comments[comments.length - 1];
    if (lastedCmt.new && lastedCmt.author.id === userInfo._id) {
      bottomCommentListRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [comments])

  React.useEffect(() => {
    if (open && !window.location.search.includes("show_comments=true")) {
      window.history.pushState({}, "", "?show_comments=true");
    }

    if (!open && window.location.search.includes("show_comments=true")) {
      window.history.back();
    }

    function handleBackEvent() {
      if (open) {
        setOpen(false)
      }
    }

    window.addEventListener("popstate", handleBackEvent);
    return () => window.removeEventListener("popstate", handleBackEvent);
  }, [open, setOpen]);

  const measuredInputCtnRef = React.useCallback(node => {
    if (!node) return;
    const resizeObserver = new ResizeObserver(() => {
      setInputCtnHeight(node?.clientHeight ?? 75)
    });
    resizeObserver.observe(node);
  }, []);

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
            isCmtLoading={isCmtLoading}
            handlePosting={handlePosting}
            isPosting={isPosting}
            isLoggedIn={isLoggedIn}
          />
          <div ref={bottomCommentListRef} style={{ height: `${inputCtnHeight}px` }} />
          <Stack
            ref={measuredInputCtnRef}
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
            <CommentInput
              onPost={handlePosting}
              isPosting={isPosting}
              isOtherTyping={isOtherTyping}
              isLoggedIn={isLoggedIn}
            />
          </Stack>
        </StyledBox>
      </SwipeableDrawer>
    </Root>
  );
}

export default CommentMobile;
