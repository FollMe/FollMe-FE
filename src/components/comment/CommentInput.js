import { useState, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom";
import { useWebSocket } from 'customHooks/useWebSocket';
import { Stack } from "@mui/system";
import Typing from 'components/animations/Typing';
import { Oval } from 'react-loading-icons'
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useUserInfo } from 'customHooks/useUserInfo';
import { Typography, Button } from "@mui/material";
import textCursorHelper from 'text-cursor-helper';
import { forceLogin } from "util/authHelper";
import { request } from 'util/request';
import { throttle, debounce } from 'util/limitCallFunction';
import styles from './CommentInput.module.scss'
import TagPopup from "./TagPopup";

const tagRegex = /@[^@]+$/g

export function CommentInput({ parentCmt, onPost, isPosting, isOtherTyping, isLoggedIn }) {
  const [userInfo] = useUserInfo();
  const { wsSend } = useWebSocket();
  const navigate = useNavigate();
  const [tagMatchedUsers, setTagMatchedUsers] = useState([]);
  const [showHint, setShowHint] = useState(true);
  const [focusedProfileIndex, setFocusedProfile] = useState(0);
  const cmtInputElement = useRef(null);
  const previousContent = useRef("");
  const timePressed = useRef({});

  function handleSignIn() {
    forceLogin();
    navigate('/sign-in');
  }

  const throttledHandleTyping = useMemo(
    () => throttle(() => {
      wsSend({
        userId: userInfo._id,
        action: "typing_cmt_post"
      })
    }, 3000),
    [wsSend, userInfo._id]
  )

  const debouncedFetchProfiles = useMemo(
    () => debounce(async (html) => {
      const matches = html?.match(tagRegex);

      if (matches?.length === 1) {
        const data = await request.get(`api/profiles?q=${matches[0].substring(1)}`);
        setTagMatchedUsers(data.profiles);
        setFocusedProfile(0);
      } else {
        setTagMatchedUsers([]);
      }
    }, 400),
    []
  )

  const handleClickProfile = (name) => {
    setTimeout(() => {
      cmtInputElement.current.innerHTML = cmtInputElement.current.innerHTML.replace(
        tagRegex,
        `<span class="cmt-tag" contenteditable="false">${name}&#x200B;</span>`
      );
      textCursorHelper.goToEnd(cmtInputElement.current)
      setTagMatchedUsers([]);
    }, 100)
  }

  return (
    <Stack spacing={1} style={{ width: '100%', position: 'relative' }}>
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
          ? <Stack className={styles.inputContainer} direction='row' sx={{ width: '100%' }} alignItems="flex-start">
            <img src={userInfo.avatar?.link ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/imgs/user.svg";
              }}
            />
            <div
              className={styles.input}
              contentEditable={!isPosting}
              ref={cmtInputElement}
              style={{
                paddingRight: isPosting ? "37px" : "12px",
                minHeight: "40px",
              }}
              onInput={e => {
                const html = e.target.innerHTML;
                const text = e.target.innerText;

                if (text === "") {
                  setShowHint(true);
                } else {
                  setShowHint(false);
                }
                if (html !== previousContent.current) {
                  throttledHandleTyping()
                  debouncedFetchProfiles(html)

                  previousContent.current = html
                }
              }}
              onKeyDown={e => {
                if (["ArrowDown", "ArrowUp"].includes(e.code)) {
                  const now = new Date().getTime();
                  if (timePressed.current[e.code] && now - timePressed.current[e.code] < 50) {
                    e.preventDefault();
                    return
                  }
                  timePressed.current[e.code] = now
                }

                switch (true) {
                  case e.code === "ArrowDown":
                    if (tagMatchedUsers.length) {
                      e.preventDefault();
                      setFocusedProfile(i => i >= tagMatchedUsers.length - 1 ? 0 : i + 1);
                    }
                    break;
                  case e.code === "ArrowUp":
                    if (tagMatchedUsers.length) {
                      e.preventDefault();
                      setFocusedProfile(i => i <= 0 ? tagMatchedUsers.length - 1 : i - 1);
                    }
                    break;
                  case e.code === "KeyB" || e.code === "KeyI" || e.code === "KeyU":
                    if (!e.ctrlKey) {
                      return;
                    }
                    e.preventDefault();
                    break;
                  default:
                }
              }}
              onKeyPress={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const now = new Date().getTime();
                  if (timePressed.current[e.code] && now - timePressed.current[e.code] < 50) {
                    return
                  }
                  timePressed.current[e.code] = now
                  if (tagMatchedUsers.length) {
                    const profile = tagMatchedUsers[focusedProfileIndex];
                    handleClickProfile(profile.name ?? profile.slEmail);
                    return;
                  }
                  if (e.shiftKey) {
                    return;
                  }
                  (async () => {
                    const text = e.currentTarget.innerText.trim();
                    if (!text) {
                      return;
                    }
                    const insight = cmtInputElement.current.innerHTML;
                    const ok = await onPost(insight, parentCmt)
                    if (ok) {
                      cmtInputElement.current.innerHTML = "";
                    }
                  })()
                }
              }}
              onPaste={e => {
                e.preventDefault();
                var text = e.clipboardData.getData('text/plain');
                document.execCommand('insertText', false, text);
              }}
            />
            {
              tagMatchedUsers.length > 0 && <TagPopup
                onClickProfile={handleClickProfile}
                focusIndex={focusedProfileIndex}
                inputElement={cmtInputElement.current}
                users={tagMatchedUsers}
                handleHideTag={() => setTagMatchedUsers([])}
              />
            }
            <Oval
              className={styles.inputLoading}
              stroke="#ff6541"
              style={{ width: isPosting ? '25px' : '0px' }}
            />
            {
              showHint && (
                <span
                  className={styles.inputHint}
                  onClick={() => cmtInputElement.current.focus()}
                >
                  Cảm nhận của bạn
                </span>
              )
            }
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