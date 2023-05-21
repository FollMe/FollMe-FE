import { useState, useRef } from "react"
import { Stack } from "@mui/system";
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { Oval } from 'react-loading-icons'
import { useUserInfo } from 'customHooks/useUserInfo';


export function CommentInput({ parentCmt, onPost, onTyping, isPosting }) {
  const [userInfo] = useUserInfo();
  const [insight, setInsight] = useState("");
  const lastedPostTyping = useRef(null);
  return (
    <Stack direction='row' sx={{ width: '100%' }} alignItems="flex-start">
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
            onTyping()
            lastedPostTyping.current = Date.now()
          }
        }}
        value={insight}
        disabled={isPosting}
      />
    </Stack>
  )
}