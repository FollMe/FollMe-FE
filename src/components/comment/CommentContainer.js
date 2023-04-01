import { Stack } from "@mui/system";
import Divider from '@mui/material/Divider';
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import OvalLoading from "components/OvalLoading";

export function CommentContainer({ comments, isLoading }) {
  return (
    <Stack spacing={2} alignItems="flex-start" sx={{
      padding: '12px',
      mb: isLoading ? '0' : '20px'
    }}>
      <CommentInput />
      <Divider sx={{
        width: '100%'
      }} />
      <div style={{ position: 'relative', width: '100%', minHeight: '30px'}}>
        {
          isLoading
            ? <OvalLoading />
            : comments.map(cmt => <CommentItem key={cmt.id} comment={cmt} />)
        }
      </div>
    </Stack>
  )
} 