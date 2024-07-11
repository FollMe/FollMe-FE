import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { IoPeopleSharp } from "react-icons/io5";
import styles from './InvitationItem.module.scss';
import dayjs from 'dayjs';
import InvitationStatusTag from './InvitationStatusTag';

export default function InvitationItem({ invitation }) {
  const navigate = useNavigate();
  const { title, location, startAt, numGuests } = invitation;
  const formattedStartAt = dayjs(startAt).format('HH:mm, DD-MM-YYYY');
  const status = new Date(startAt) > new Date() ? 'upcoming' : 'happened';

  function handleClickItem() {
    navigate(`/events/${invitation._id}`)
  }

  return (
    <Grid item md={8} sm={12} xs={12}>
      <div className={styles.storyContentContainer}>
        <div className={styles.storyContentHeader}>
          <Typography gutterBottom variant="h4" component="div"
            className={styles.storyContent_title}
            sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color-title)', mb: '12px' }}
            onClick={handleClickItem}
          >
            {title}
          </Typography>
          <InvitationStatusTag status={status} />
        </div>
        <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5 }}>
          Địa điểm: {location}
        </Typography>
        <Typography variant="body" color="text.secondary">
          Thời gian: {formattedStartAt}
        </Typography>
        <div className={styles.storyContent_btnFunction}>
          <div className={styles.btnFunction_like}>
            <IoPeopleSharp />
            <span>{numGuests ?? "..."}</span>
          </div>
        </div>
      </div>
    </Grid>
  )
}
