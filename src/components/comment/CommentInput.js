import { Stack } from "@mui/system";
import OutlinedInput from '@mui/material/OutlinedInput';


export function CommentInput() {
  return (
    <Stack direction='row' sx={{ width: '100%' }} alignItems="flex-start">
      <img src={null ?? '#'} alt="User Logo" style={{ width: '40px', borderRadius: '50%' }}
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src = "/imgs/user.svg";
        }}
      />
      <OutlinedInput
        sx={{
          width: '100%',
          padding: '10px 12px',
          marginLeft: '16px',
          borderRadius: '18px'
        }}
        maxRows={10}
        multiline={true}
        color='follme'
        placeholder="Cảm nhận của bạn" />
    </Stack>
  )
}