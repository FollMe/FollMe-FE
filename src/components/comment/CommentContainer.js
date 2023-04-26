import { useState, useEffect } from 'react';
import { Stack } from "@mui/system";
import Divider from '@mui/material/Divider';
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import OvalLoading from "components/OvalLoading";
import { CommentType } from "instants/comment.instant";
import { useUserInfo } from 'customHooks/useUserInfo';
import { request } from 'util/request';

export function CommentContainer({ storySlug }) {
  const [userInfo] = useUserInfo();
  const [comments, setComments] = useState([]);
  const [isCmtLoading, setIsCmtLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const handlePosting = async (content, parentId) => {
    setIsPosting(true);
    try {
      await request.post("comment-svc/api/comments", {
        postSlug: storySlug,
        content,
        parentId
      });

      const newCmt = {
        content: content,
        createdAt: Date.now(),
        author: {
          avatar: userInfo.avatar,
          name: userInfo.name
        }
      }
      const updatedComments = JSON.parse(JSON.stringify(comments))
      if (parentId) {
        const parentIndex = updatedComments.findIndex((cmt) => cmt.id === parentId)
        if (!updatedComments[parentIndex].replies) {
          updatedComments[parentIndex].replies = []
        }
        updatedComments[parentIndex].replies?.push(newCmt)
      } else {
        updatedComments.push({
          content: content,
          createdAt: Date.now(),
          author: {
            avatar: userInfo.avatar,
            name: userInfo.name
          }
        })
      }
      setComments(updatedComments)
      return true
    } catch (err) {
      console.log(err)
      return false
    } finally {
      setIsPosting(false);
    }
  }

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
  }, [storySlug])
  return (
    <Stack spacing={2} alignItems="flex-start" sx={{
      padding: '12px',
      mb: isCmtLoading ? '0' : '20px'
    }}>
      <Stack spacing={1} style={{ position: 'relative', width: '100%', minHeight: '30px' }}>
        {
          isCmtLoading
            ? <OvalLoading />
            : comments.length <= 0
              ? <div style={{ textAlign: 'center', opacity: '0.7' }}> Hãy là người đầu tiên chia sẻ cảm xúc của mình </div>
              : comments.map(cmt =>
                <CommentItem
                  key={cmt.id}
                  handlePosting={handlePosting}
                  isPosting={isPosting}
                  comment={cmt}
                  type={CommentType.PARENT}
                />
              )
        }
      </Stack>
      <Divider sx={{
        width: '100%'
      }} />
      <CommentInput onPost={handlePosting} isPosting={isPosting} />
    </Stack>
  )
} 