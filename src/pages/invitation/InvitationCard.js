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
import QRModel from './QRModel';

export default function InvitationCard() {
  const { id: invitationId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletedSplash, setIsCompetedSplash] = useState(false);
  const [event, setEvent] = useState({});
  const [duration, setDuration] = useState(null);
  const [isShowQR, setIsShowQR] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsCompetedSplash(true);
    }, 800);
    getInvitation();
    var intervalId = '';
    async function getInvitation() {
      setIsLoading(true);
      const res = await request.get(`api/invitations/${invitationId}`);
      const startAt = new Date(res.invitation.event?.startAt)
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000)
      const event = {
        ...res.invitation.event,
        startAt,
        endAt
      }

      setEvent(event);

      if (calculateDuration()) {
        intervalId = setInterval(() => {
          if (!calculateDuration()) {
            clearInterval(intervalId);
          }
        }, 1000)
      }

      function calculateDuration() {
        const distance = startAt.getTime() - new Date().getTime();
        if (distance < 0) {
          toast.warning("Sự kiện đã diễn ra", {
            autoClose: false
          })
          return false;
        }

        setDuration({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
        return true;
      }

      setIsLoading(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
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
                {event.title}
              </Typography>

              <div className={styles.eventTime}>
                <div className={styles.timeItem}>
                  {('0' + event.startAt?.getHours()).slice(-2)}
                </div>
                <div className={styles.timeItem}>
                  {('0' + event.startAt?.getMinutes()).slice(-2)}
                </div>
              </div>

              <Grid className={styles.eventDate} container spacing={2}>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Ngày
                  </div>
                  <div className={styles.dateValue}>
                    {event.startAt?.getDate()}
                  </div>
                </Grid>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Tháng
                  </div>
                  <div className={styles.dateValue}>
                    {event.startAt?.getMonth() + 1}
                  </div>
                </Grid>
                <Grid className={styles.dateItem} xs={4}>
                  <div className={styles.dateLabel}>
                    Năm
                  </div>
                  <div className={styles.dateValue}>
                    {event.startAt?.getFullYear()}
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
                {event.location}
                {
                  event.mapLocation &&
                  <a href={event.mapLocation} target='_blank' rel="noreferrer">
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
                      name={event.title}
                      options={['Google', 'Apple', 'Outlook.com']}
                      location={`${event.location} [${event.mapLocation}]`}
                      startDate={dayjs(event.startAt).format('YYYY-MM-DD')}
                      endDate={dayjs(event.endAt).format('YYYY-MM-DD')}
                      startTime={dayjs(event.startAt).format('HH:mm')}
                      endTime={dayjs(event.endAt).format('HH:mm')}
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
                      onClick={() => setIsShowQR(true)}
                    >
                      Mã
                    </Button>
                  </Grid>
                </Grid>
              </div>
            </div>
            {isShowQR && <QRModel
              value={invitationId}
              handleClose={() => setIsShowQR(false)}
            />}
          </Paper>
      }
    </>
  )
}