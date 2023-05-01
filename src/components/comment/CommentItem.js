import { Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import { formatDate } from 'util/date.js';
import { CommentInput } from "./CommentInput";
import { CommentType } from "instants/comment.instant";

export function CommentItem({ comment, type, isPosting, handlePosting }) {
  const [isShowReply, setIsShowReply] = useState(false)

  const toggleShowReply = () => {
    setIsShowReply(current => !current)
  }

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
      <img src={comment.author.avatar?.link ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src = "/imgs/user.svg";
        }}
      />
      <Stack spacing={1} sx={{ width: '100%' }}>
        <Stack direction="row" >
          <div>
            <Box
              sx={{
                backgroundColor: comment.new ? '#ebeeff' : '#f1f1f1',
                p: '8px 16px',
                borderRadius: '20px'
              }}
            >
              <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
                {comment.author.name ?? comment.author.slEmail}
              </Typography>
              <Typography variant="body2" component="span">
                {comment.content}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                marginTop: '5px', marginLeft: '15px'
              }}
            >
              {type === CommentType.PARENT ?
                <div onClick={toggleShowReply} style={{ cursor: 'pointer' }}>
                  Phản hồi
                </div>
                : ""
              }
              <span style={{ opacity: '0.7' }}> {formatDate(comment.createdAt)} </span>
            </Stack>
          </div>
        </Stack>

        {
          comment.replies?.map(reply => (
            <CommentItem key={reply.id} comment={reply} type={CommentType.CHILD} />
          ))
        }
        {
          isShowReply ? <CommentInput parentCmt={comment.id} onPost={handlePosting} isPosting={isPosting}/> : ""
        }
      </Stack>
    </Stack>
  )
}
