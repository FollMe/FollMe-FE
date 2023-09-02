import { useState, useEffect, useRef } from 'react';
import { useUserInfo } from 'customHooks/useUserInfo';
import { useWebSocket } from 'customHooks/useWebSocket';
import { request } from 'util/request';
import notificationSound from 'assets/audios/notification_sound.wav'
import { CommentInterface } from './CommentInterface';
import { CommentDesktop } from './CommentDesktop';
import CommentMobile from './CommentMobile';

const MOBILE_MAX_WIDTH = 760;

const audio = new Audio(notificationSound)

export function CommentContainer({ storySlug, writerId }) {
  const [userInfo] = useUserInfo();
  const [ws] = useWebSocket();
  const [comments, setComments] = useState([]);
  const [isCmtLoading, setIsCmtLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [openCmtDialog, setOpenCmtDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_MAX_WIDTH);
  const timeOutTyping = useRef("");

  const handlePosting = async (content, parentId) => {
    setIsPosting(true);
    try {
      const res = await request.post("comment-svc/api/comments", {
        postSlug: storySlug,
        content,
        parentId
      });
      const author = {
        id: userInfo._id,
        avatar: userInfo.avatar,
        name: userInfo.name
      }
      handlePosted({ id: res.id, parentId, content, author })
      return true
    } catch (err) {
      console.log(err)
      return false
    } finally {
      setIsPosting(false);
    }
  }

  const handlePosted = (params) => {
    if (params.author.id === writerId || params.author._id === writerId) {
      params.author.writer = true;
    }
    const newCmt = {
      id: params.id,
      content: params.content,
      createdAt: Date.now(),
      author: params.author || { name: "..." },
      new: true,
    }
    const updatedComments = JSON.parse(JSON.stringify(comments))
    if (params.parentId) {
      const parentIndex = updatedComments.findIndex((cmt) => cmt.id === params.parentId)
      if (!updatedComments[parentIndex].replies) {
        updatedComments[parentIndex].replies = []
      }
      updatedComments[parentIndex].replies?.push(newCmt)
    } else {
      updatedComments.push(newCmt)
    }
    setComments(updatedComments)
    setIsOtherTyping(false)
  }

  const handleTyping = () => {
    ws.send(JSON.stringify({
      userId: userInfo._id,
      action: "typing_cmt_post"
    }))
  }

  function resize() {
    setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
  }

  useEffect(() => {
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      switch (data.action) {
        case "commented":
          (async () => {
            const newCmt = JSON.parse(data.message)
            const res = await request.post("api/profiles/get", {
              ids: [newCmt.author]
            })
            const profiles = res?.profiles ?? {};
            handlePosted({
              id: newCmt.id,
              content: newCmt.content,
              parentId: newCmt.parentId,
              author: profiles[newCmt.author]
            })
            if (profiles[newCmt.author]._id !== userInfo._id) {
              audio.play();
            }
          })()
          break;
        case "typing_cmt_post":
          setIsOtherTyping(true);
          if (timeOutTyping.current) {
            clearTimeout(timeOutTyping.current);
          }
          timeOutTyping.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 4000)
          break;
        default:
      }
    }
  }, [comments])

  useEffect(() => {
    getComments()
    async function getComments() {
      try {
        const data = await request.get(`comment-svc/api/comments/${storySlug}`);

        if (!Array.isArray(data.comments) || data.comments.length <= 0) {
          return;
        }

        const authorIds = {};
        data.comments.forEach(cmt => {
          authorIds[cmt.author] = true
          cmt.replies?.forEach(reply => {
            authorIds[reply.author] = true
          })
        })

        const res = await request.post("api/profiles/get", {
          ids: Object.keys(authorIds)
        })
        const profiles = res?.profiles ?? {};
        for (const authorId in profiles) {
          if (authorId === writerId) {
            profiles[authorId].writer = true
          }
        }
        data.comments.forEach(cmt => {
          if (profiles[cmt.author]) {
            cmt.author = profiles[cmt.author]
          }
          cmt.replies?.forEach(reply => {
            if (profiles[reply.author]) {
              reply.author = profiles[reply.author]
            }
          })
        })

        setComments(data.comments);
      } catch (err) {
        console.log(err);
      } finally {
        setIsCmtLoading(false);
      }
    }

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    }
  }, [storySlug])

  return (
    <>
      {isMobile
        ? <CommentMobile
          open={openCmtDialog}
          setOpen={setOpenCmtDialog}
          comments={comments}
          handlePosting={handlePosting}
          handleTyping={handleTyping}
          isPosting={isPosting}
          isCmtLoading={isCmtLoading}
          isOtherTyping={isOtherTyping}
        />
        : <CommentDesktop
          open={openCmtDialog}
          setOpen={setOpenCmtDialog}
          comments={comments}
          handlePosting={handlePosting}
          handleTyping={handleTyping}
          isPosting={isPosting}
          isCmtLoading={isCmtLoading}
          isOtherTyping={isOtherTyping}
        />
      }

      <CommentInterface
        numsOfCmt={comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length ?? 0), 0)}
        setOpenCmtDialog={setOpenCmtDialog}
        isCmtLoading={isCmtLoading}
      />
    </>
  )
} 