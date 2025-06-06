import { Stack } from "@mui/system";

import OvalLoading from "components/loading/OvalLoading";
import { CommentItem } from "./CommentItem";
import { CommentType } from "instants/comment.instant";

export function CommentList({ comments, isCmtLoading, handlePosting, isPosting, isLoggedIn }) {
  return (
    <>
      <Stack spacing={1} style={{ position: 'relative', width: '100%', minHeight: '300px' }}>
        {
          isCmtLoading
            ? <OvalLoading />
            : comments.length <= 0
              ? <div style={{ textAlign: 'center', opacity: '0.7' }}> Hãy là người đầu tiên chia sẻ cảm xúc của mình😍 </div>
              : comments.map(cmt =>
                <CommentItem
                  key={cmt.id}
                  handlePosting={handlePosting}
                  isPosting={isPosting}
                  comment={cmt}
                  type={CommentType.PARENT}
                  isLoggedIn={isLoggedIn}
                />
              )
        }
      </Stack>
    </>
  )
}
