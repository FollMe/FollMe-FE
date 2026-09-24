import { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import { IoBookmarkOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { fortuneApi, formatBirth, toBirthPayload } from 'util/fortune';

/**
 * Saves the current birth as a profile plus a history entry. Anonymous users
 * are asked to sign in: their results are never stored.
 */
export default function SaveToProfileButton({ birth, method }) {
  const [userInfo] = useUserInfo();
  const isLoggedIn = useMemo(() => handleCheckLoggedIn(userInfo.sessionExp), [userInfo]);
  const [showSignIn, setShowSignIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [gender, setGender] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleClick() {
    if (!isLoggedIn) {
      setShowSignIn(true);
      return;
    }
    setLabel(birth.fullName || 'Tôi');
    setGender(birth.gender || '');
    setOpen(true);
  }

  async function handleSave() {
    if (!label.trim() || !gender) {
      return;
    }
    try {
      setIsSaving(true);
      const profile = await fortuneApi.createProfile({ ...toBirthPayload(birth), label: label.trim(), gender });
      await fortuneApi.createReading({ profileId: profile.id, method });
      toast.success('Đã lưu vào hồ sơ của bạn');
      setOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<IoBookmarkOutline />} onClick={handleClick}>
        Lưu hồ sơ
      </Button>
      {showSignIn && <RequestSignInDialog open={true} setOpen={setShowSignIn} action="lưu hồ sơ" />}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lưu hồ sơ</DialogTitle>
        <DialogContent>
          <p className="muted" style={{ marginTop: 0 }}>{formatBirth(birth)}</p>
          <TextField
            autoFocus
            fullWidth
            label="Tên hồ sơ"
            placeholder="Ví dụ: Tôi, Người yêu, Mẹ"
            inputProps={{ maxLength: 50 }}
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          {!birth.gender && (
            <div style={{ marginTop: 16 }}>
              <ToggleButtonGroup exclusive size="small" color="primary" value={gender} onChange={(_, value) => value && setGender(value)}>
                <ToggleButton value="male">Nam</ToggleButton>
                <ToggleButton value="female">Nữ</ToggleButton>
              </ToggleButtonGroup>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <LoadingButton variant="contained" loading={isSaving} disabled={!label.trim() || !gender} onClick={handleSave}>
            Lưu
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
