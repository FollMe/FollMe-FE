import { Paper, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/system/Unstable_Grid';
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import QrCodeIcon from '@mui/icons-material/QrCode';
import styles from "./InvitationCard.module.scss";

export default function InvitationCard() {
  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(207deg, rgba(51,51,51,1) 69%, rgba(182,182,182,1) 100%);',
        p: '10px',
        pt: '100px',
      }}
    >
      <div className={styles.invitationPage}>
        <Typography
          className={styles.youAreInvitedLabel}
          gutterBottom
          variant="h4"
          component="div"
          sx={{
            textTransform: 'uppercase',
            color: 'white',
            textAlign: 'center'
          }}
        >
          Bạn được mời tham dự
        </Typography>

        <Typography
          className={styles.eventName}
          gutterBottom
          variant="h4"
          component="div"
        >
          Hôm nay ăn gì Party
        </Typography>

        <div className={styles.eventTime}>
          <div className={styles.timeItem}>
            09
          </div>
          <div className={styles.timeItem}>
            00
          </div>
        </div>

        <Grid className={styles.eventDate} container spacing={2}>
          <Grid item className={styles.dateItem} xs={4}>
            <div className={styles.dateLabel}>
              Ngày
            </div>
            <div className={styles.dateValue}>
              18
            </div>
          </Grid>
          <Grid item className={styles.dateItem} xs={4}>
            <div className={styles.dateLabel}>
              Tháng
            </div>
            <div className={styles.dateValue}>
              12
            </div>
          </Grid>
          <Grid item className={styles.dateItem} xs={4}>
            <div className={styles.dateLabel}>
              Năm
            </div>
            <div className={styles.dateValue}>
              2023
            </div>
          </Grid>
        </Grid>

        <Grid className={styles.eventCountDown} container spacing={1}>
          <Grid item xs={3}>
            <div className={styles.countDownItem}>
              <div className={styles.countDownValue}>
                00
              </div>
              <div className={styles.countDownLabel}>
                NGÀY
              </div>
            </div>
          </Grid>
          <Grid item xs={3}>
            <div className={styles.countDownItem}>
              <div className={styles.countDownValue}>
                18
              </div>
              <div className={styles.countDownLabel}>
                GIỜ
              </div>
            </div>
          </Grid>
          <Grid item xs={3}>
            <div className={styles.countDownItem}>
              <div className={styles.countDownValue}>
                18
              </div>
              <div className={styles.countDownLabel}>
                PHÚT
              </div>
            </div>
          </Grid>
          <Grid item xs={3}>
            <div className={styles.countDownItem}>
              <div className={styles.countDownValue}>
                59
              </div>
              <div className={styles.countDownLabel}>
                GIÂY
              </div>
            </div>
          </Grid>
        </Grid>

        <div className={styles.eventLocationContainer}>
          <a className={styles.eventLocation}>
            Tò Te quán, 35/9 Bình Lợi, phường 13, quận Bình Thạnh, thành phố Hồ Chí Minh
            <ArrowCircleRightIcon />
          </a>
        </div>

        <div className={styles.functionBox}>
          <Grid container spacing={2}>
            <Grid item className={styles.dateItem} xs={6}>
              <AddToCalendarButton
                styleLight="--font: Roboto"
                label='Lưu'
                name="Title"
                options={['Google', 'Apple', 'Outlook.com']}
                location="World Wide Web"
                startDate="2023-09-20"
                endDate="2023-09-20"
                startTime="10:15"
                endTime="23:30"
                timeZone="America/Los_Angeles"
                language="vi"
              ></AddToCalendarButton>
            </Grid>
            <Grid item xs={6}>
              <Button
                className={styles.showQr}
                startIcon={<QrCodeIcon />}
                variant="contained"
                sx={{
                  backgroundColor: 'var(--theme-color)',
                  textTransform: 'none',
                  fontSize: '1.2rem',
                }}
              >
                Mã
              </Button>
            </Grid>
          </Grid>

        </div>
      </div>
    </Paper>
  )
}