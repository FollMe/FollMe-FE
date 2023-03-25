import { Stack } from "@mui/system";
import Divider from '@mui/material/Divider';
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

export function CommentContainer({ comments }) {
  return (
    <Stack spacing={2} alignItems="flex-start" sx={{
      padding: '12px'
    }}>
      <CommentInput />
      <Divider sx={{
        width: '100%'
      }} />
      {
        comments.map(cmt => <CommentItem key={cmt.id} comment={cmt}/>)
      }
    </Stack>
  )
} 