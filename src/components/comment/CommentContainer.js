import { useState, useEffect, useRef, useMemo } from 'react';
import { useUserInfo } from 'customHooks/useUserInfo';
import { useWebSocket } from 'customHooks/useWebSocket';
import { request } from 'util/request';
import { addComment } from 'util/comments';
import notificationSound from 'assets/audios/notification_sound.wav'
import { CommentInterface } from './CommentInterface';
import { CommentDesktop } from './CommentDesktop';
import CommentMobile from './CommentMobile';

const MOBILE_MAX_WIDTH = 760;

const audio = new Audio(notificationSound)

export function CommentContainer({ storySlug, writerId }) {
  const [userInfo] = useUserInfo();
  const { addActions, removeActions } = useWebSocket();
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
        _id: userInfo._id,
        avatar: userInfo.avatar,
        name: userInfo.name,
        slEmail: userInfo.slEmail,
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

  const handlePosted = ({ id, parentId, content, author }) => {
    const newCmt = {
      id,
      content,
      createdAt: Date.now(),
      author: author ?? { name: "..." },
      new: true,
    }
    // Functional update: the POST response and the broadcast of the same
    // comment, or of someone else's, can land in any order.
    setComments(current => addComment(current, newCmt, parentId))
    setIsOtherTyping(false)
  }

  function resize() {
    setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
  }

  useEffect(() => {
    addActions([
      {
        action: "commented",
        do: async (message) => {
          const newCmt = JSON.parse(message)
          let author;
          try {
            const res = await request.post("api/profiles/get", {
              ids: [newCmt.author]
            })
            author = res?.profiles?.[newCmt.author];
          } catch (err) {
            console.log(err);
          }
          handlePosted({
            id: newCmt.id,
            content: newCmt.content,
            parentId: newCmt.parentId,
            author,
          })
          if (author?._id !== userInfo._id) {
            // Browsers refuse to play before the reader has interacted.
            audio.play().catch(() => { });
          }
        }
      },
      {
        action: "typing_cmt_post",
        do: () => {
          setIsOtherTyping(true);
          if (timeOutTyping.current) {
            clearTimeout(timeOutTyping.current);
          }
          timeOutTyping.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 4000)
        }
      }
    ])
    return () => {
      removeActions(["commented", "typing_cmt_post"]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storySlug, writerId, userInfo._id])

  useEffect(() => {
    // The page stays mounted when moving to another post (related posts,
    // next chapter): start clean and drop answers for the previous post.
    let isCurrent = true;
    setComments([]);
    setIsCmtLoading(true);
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

        if (isCurrent) {
          setComments(data.comments);
        }
      } catch (err) {
        console.log(err);
      } finally {
        if (isCurrent) {
          setIsCmtLoading(false);
        }
      }
    }

    return () => {
      isCurrent = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storySlug])

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [])

  // The author is known only once the post has loaded.
  const shownComments = useMemo(() => {
    if (!writerId) {
      return comments;
    }
    const mark = author => (author?._id === writerId && !author.writer ? { ...author, writer: true } : author);
    return comments.map(cmt => ({
      ...cmt,
      author: mark(cmt.author),
      replies: cmt.replies?.map(reply => ({ ...reply, author: mark(reply.author) })),
    }));
  }, [comments, writerId])

  return (
    <>
      {isMobile
        ? <CommentMobile
          open={openCmtDialog}
          setOpen={setOpenCmtDialog}
          comments={shownComments}
          handlePosting={handlePosting}
          isPosting={isPosting}
          isCmtLoading={isCmtLoading}
          isOtherTyping={isOtherTyping}
        />
        : <CommentDesktop
          open={openCmtDialog}
          setOpen={setOpenCmtDialog}
          comments={shownComments}
          handlePosting={handlePosting}
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