import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom";
import { useWebSocket } from 'customHooks/useWebSocket';
import { Stack } from "@mui/system";
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Typing from 'components/animations/Typing';
import { Oval } from 'react-loading-icons'
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useUserInfo } from 'customHooks/useUserInfo';
import { Typography, Button } from "@mui/material";
import { forceLogin } from "util/authHelper";


export function CommentInput({ parentCmt, onPost, isPosting, isOtherTyping, isLoggedIn }) {
  const [userInfo] = useUserInfo();
  const {wsSend} = useWebSocket();
  const navigate = useNavigate();
  const [insight, setInsight] = useState("");
  const lastedPostTyping = useRef(null);

  function handleSignIn() {
    forceLogin();
    navigate('/sign-in');
  }

  const handleTyping = () => {
    wsSend({
      userId: userInfo._id,
      action: "typing_cmt_post"
    })
  }

  return (
    <Stack spacing={1} style={{ width: '100%' }}>
      {
        isOtherTyping ?
          <div className='typingBox' style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Typing width={38} />
            <span style={{ opacity: "0.7", marginLeft: "8px" }}>
              Ai đó đang gõ😍
            </span>
          </div> : ""
      }
      {
        isLoggedIn
          ? <Stack direction='row' sx={{ width: '100%' }} alignItems="flex-start">
            <img src={userInfo.avatar?.link ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/imgs/user.svg";
              }}
            />
            <OutlinedInput
              endAdornment={
                <InputAdornment position="end">
                  <Oval stroke="#ff6541" style={{ width: isPosting ? '25px' : '0' }} />
                </InputAdornment>
              }
              sx={{
                width: '100%',
                padding: '10px 12px',
                marginLeft: '16px',
                borderRadius: '18px'
              }}
              maxRows={10}
              multiline={true}
              color='follme'
              placeholder="Cảm nhận của bạn"
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (async () => {
                    if (!insight) {
                      return;
                    }
                    const ok = await onPost(insight, parentCmt)
                    if (ok) {
                      setInsight("")
                    }
                  })()
                }
              }}
              onChange={e => {
                const content = e.target.value;
                setInsight(content)
                const needPost = lastedPostTyping.current
                  ? Date.now() - lastedPostTyping.current > 3000
                    ? true : false
                  : true;
                if (content && needPost) {
                  handleTyping()
                  lastedPostTyping.current = Date.now()
                }
              }}
              value={insight}
              disabled={isPosting}
            />
          </Stack>
          : <Stack direction='row' sx={{ width: '100%' }} alignItems="center" justifyContent="space-between">
            <Typography>
              Đăng nhập để bình luận😊
            </Typography>
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
          </Stack>
      }
    </Stack>
  )
}