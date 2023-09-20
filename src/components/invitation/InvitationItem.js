import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { IoPeopleSharp } from "react-icons/io5";
import styles from './InvitationItem.module.scss';

import { formatDateTime } from 'util/date.js';

export default function InvitationItem({ invitation }) {
  const navigate = useNavigate();
  const { title, location, startAt, numGuests } = invitation;
  const formattedStartAt = formatDateTime(startAt);

  function handleClickItem() {
    navigate(`/invitations/${invitation._id}`)
  }

  return (
    <div>
      <Grid container columnSpacing={2} rowSpacing={2}>
        <Grid item md={8} sm={12} xs={12}>
          <div className={styles.storyContentContainer}>
            <Typography gutterBottom variant="h4" component="div"
              className={styles.storyContent_title}
              sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color-title)', mb: '12px' }}
              onClick={handleClickItem}
            >
              {title}
            </Typography>
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
      </Grid>
    </div>
  )
}
