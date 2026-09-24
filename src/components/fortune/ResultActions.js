import { useState } from 'react';
import Button from '@mui/material/Button';
import { IoImageOutline } from 'react-icons/io5';
import ShareButton from 'components/ShareButton';
import SaveToProfileButton from './SaveToProfileButton';
import styles from './ResultActions.module.scss';

/**
 * Share (link with the birth data in the URL fragment), download the result
 * card as an image, and save to profile.
 */
export default function ResultActions({ title, birth, method, cardRef, fileName }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    if (!cardRef?.current) {
      return;
    }
    try {
      setIsExporting(true);
      // Loaded on demand: only needed when someone exports an image.
      const { toPng } = await import('html-to-image');
      const background = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: background, cacheBust: true });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.log(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={styles.actions}>
      <ShareButton title={title} />
      <Button variant="outlined" size="small" startIcon={<IoImageOutline />} onClick={handleDownload} disabled={isExporting}>
        {isExporting ? 'Đang tạo ảnh…' : 'Tải ảnh'}
      </Button>
      <SaveToProfileButton birth={birth} method={method} />
    </div>
  );
}
