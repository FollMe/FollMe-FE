import { Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useState } from "react";
import { CommentInput } from "./CommentInput";

export function CommentItem() {
  const [isShowReply, setIsShowReply] = useState(false)

  const toggleShowReply = () => {
    setIsShowReply(current => !current)
  }

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <img src={null ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src = "/imgs/user.svg";
        }}
      />
      <Stack spacing={1}>
        <div>
          <Box
            sx={{
              backgroundColor: '#f1f1f1', p: '8px 16px',
              borderRadius: '20px'
            }}
          >
            <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
              Thuy Uyen
            </Typography>
            <Typography variant="body2" component="span">
              Truyen hay qua a ldsjglksd lsdjlgkjds lsdjglkdjfg lsdjglkdj ldsjfglsdj ljdsgfj Truyen hay qua a ldsjglksd lsdjlgkjds lsdjglkdjfg lsdjglkdj ldsjfglsdj ljdsgfj
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              marginTop: '5px', marginLeft: '15px'
            }}
          >
            <div onClick={toggleShowReply} style={{ cursor: 'pointer' }}>
              Phản hồi
            </div>
            <span style={{ opacity: '0.7' }}> 5 phút trước </span>
          </Stack>
        </div>


        {/* Child comments */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <img src={null ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = "/imgs/user.svg";
            }}
          />
          <Stack spacing={1}>
            <div>
              <Box
                sx={{
                  backgroundColor: '#f1f1f1', p: '8px 16px',
                  borderRadius: '20px'
                }}
              >
                <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
                  Thuy Uyen
                </Typography>
                <Typography variant="body2" component="span">
                  Truyen hay qua a ldsjglksd lsdjlgkjds lsdjglkdjfg lsdjglkdj ldsjfglsdj ljdsgfj Truyen hay qua a ldsjglksd lsdjlgkjds lsdjglkdjfg lsdjglkdj ldsjfglsdj ljdsgfj
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  marginTop: '5px', marginLeft: '15px'
                }}
              >
                <div>Phản hồi</div>
                <span style={{ opacity: '0.7' }}> 5 phút trước </span>
              </Stack>
            </div>
          </Stack>
        </Stack>
        {
          isShowReply ? <CommentInput /> : ""
        } 
      </Stack>
    </Stack>
  )
}
