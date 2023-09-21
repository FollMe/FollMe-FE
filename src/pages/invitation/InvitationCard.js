import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/system/Unstable_Grid';
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import dayjs from 'dayjs';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { ECardLoading } from 'components/loading/ECardLoading';
import styles from "./InvitationCard.module.scss";
import { request } from 'util/request';
import { toast } from 'react-toastify';

export default function InvitationCard() {
  const { id: eventId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletedSplash, setIsCompetedSplash] = useState(false);
  const [invitation, setInvitation] = useState({});
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setIsCompetedSplash(true);
    }, 800);
    getInvitation();
    var intervalId = '';
    async function getInvitation() {
      setIsLoading(true);
      const res = await request.get(`api/invitations/${eventId}`);
      const startAt = new Date(res.invitation.startAt)
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000)
      const invitation = {
        ...res.invitation,
        startAt,
        endAt
      }
      setInvitation(invitation);
      intervalId = setInterval(() => {
        const distance = startAt.getTime() - new Date().getTime();
        if (distance < 0) {
          toast.warning("Sự kiện đã diễn ra", {
            autoClose: false
          })
          clearInterval(intervalId);
          return;
        }
        setDuration({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }, 1000)

      setIsLoading(false);
    }
    return () => {
      clearInterval(intervalId);
    }
  }, [])

  return (
    <>
      {
        isLoading || !isCompletedSplash
          ? <ECardLoading />
          : <Paper
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
                {invitation.title}
              </Typography>

              <div className={styles.eventTime}>
                <div className={styles.timeItem}>
                  {invitation.startAt?.getHours()}
                </div>
                <div className={styles.timeItem}>
                  {invitation.startAt?.getMinutes()}
                </div>
              </div>

              <Grid className={styles.eventDate} container spacing={2}>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Ngày
                  </div>
                  <div className={styles.dateValue}>
                    {invitation.startAt?.getDate()}
                  </div>
                </Grid>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Tháng
                  </div>
                  <div className={styles.dateValue}>
                    {invitation.startAt?.getMonth() + 1}
                  </div>
                </Grid>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Năm
                  </div>
                  <div className={styles.dateValue}>
                    {invitation.startAt?.getFullYear()}
                  </div>
                </Grid>
              </Grid>
              {
                duration ?
                  <Grid className={styles.eventCountDown} container spacing={1}>
                    <Grid xs={3}>
                      <div className={styles.countDownItem}>
                        <div className={styles.countDownValue}>
                          {duration.days}
                        </div>
                        <div className={styles.countDownLabel}>
                          NGÀY
                        </div>
                      </div>
                    </Grid>
                    <Grid xs={3}>
                      <div className={styles.countDownItem}>
                        <div className={styles.countDownValue}>
                          {duration.hours}
                        </div>
                        <div className={styles.countDownLabel}>
                          GIỜ
                        </div>
                      </div>
                    </Grid>
                    <Grid xs={3}>
                      <div className={styles.countDownItem}>
                        <div className={styles.countDownValue}>
                          {duration.minutes}
                        </div>
                        <div className={styles.countDownLabel}>
                          PHÚT
                        </div>
                      </div>
                    </Grid>
                    <Grid xs={3}>
                      <div className={styles.countDownItem}>
                        <div className={styles.countDownValue}>
                          {duration.seconds}
                        </div>
                        <div className={styles.countDownLabel}>
                          GIÂY
                        </div>
                      </div>
                    </Grid>
                  </Grid> :
                  <div className={styles.alreadyHappenedLabel}>
                    SỰ KIỆN ĐÃ DIỄN RA!
                  </div>
              }
              <div className={styles.eventLocationContainer}>
                {invitation.location}
                {
                  invitation.mapLocation &&
                  <a href={invitation.mapLocation} target='_blank' rel="noreferrer">
                    <ArrowCircleRightIcon />
                  </a>
                }
              </div>

              <div className={styles.functionBox}>
                <Grid container spacing={2}>
                  <Grid className={styles.dateItem} xs={6}>
                    <AddToCalendarButton
                      styleLight="--font: Roboto"
                      label='Lưu'
                      name={invitation.title}
                      options={['Google', 'Apple', 'Outlook.com']}
                      location={`${invitation.location} [${invitation.mapLocation}]`}
                      startDate={dayjs(invitation.startAt).format('YYYY-MM-DD')}
                      endDate={dayjs(invitation.endAt).format('YYYY-MM-DD')}
                      startTime={dayjs(invitation.startAt).format('HH:mm')}
                      endTime={dayjs(invitation.endAt).format('HH:mm')}
                      timeZone="Asia/Bangkok"
                      language="vi"
                    ></AddToCalendarButton>
                  </Grid>
                  <Grid xs={6}>
                    <Button
                      className={styles.showQr}
                      startIcon={<QrCodeIcon />}
                      variant="contained"
                      sx={{
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
      }
    </>
  )
}