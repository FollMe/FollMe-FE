import { useState } from 'react';
import Button from '@mui/material/Button';
import { IoLinkOutline, IoCheckmark } from 'react-icons/io5';

export default function ShareButton({ title }) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Button variant="outlined" size="small" onClick={handleShare} startIcon={isCopied ? <IoCheckmark /> : <IoLinkOutline />}>
      {isCopied ? 'Đã sao chép' : 'Chia sẻ'}
    </Button>
  )
}
