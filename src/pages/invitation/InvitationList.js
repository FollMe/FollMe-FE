import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, Tooltip, IconButton } from '@mui/material';
import { request } from 'util/request';
import StorySkeleton from 'components/skeletons/StorySkeleton';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import { Oval } from 'react-loading-icons'
import styles from "./InvitationList.module.scss";
import InvitationItem from 'components/invitation/InvitationItem';
import { debounce, sleep } from 'util/limitCallFunction';

export default function InvitationList() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const currentPage = useRef(1);
  const isFetchingRef = useRef(false);
  const eventListElement = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchEvent = useCallback(async () => {
    if (!eventListElement.current
      || isFetchingRef.current
      || currentPage.current < 1
    ) {
      return false
    };
    isFetchingRef.current = true;
    try {
      const rect = eventListElement.current.getBoundingClientRect();
      const isFullyShow = rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (!isFullyShow) {
        return false;
      }

      // Fetch
      setIsFetching(true);
      const res = await request.get(`api/events?page=${currentPage.current + 1}`);
      const invitations = res.invitations;
      if (!Array.isArray(invitations) || invitations.length <= 0) {
        currentPage.current = 0;
        return false;
      }

      setInvitations(curr => [...curr, ...invitations]);
      currentPage.current++;
      return true;

    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, []);

  const fetchEventListener = useCallback(debounce(handleFetchEvent, 200), []);

  useEffect(() => {
    document.title = "Invitation | FollMe";
    getInvitation();

    async function getInvitation() {
      try {
        setIsLoading(true);
        const res = await request.get('api/events');
        setIsLoading(false);
        const invitations = res.invitations;
        if (!Array.isArray(invitations)) {
          return;
        }
        setInvitations(invitations);

        (async () => {
          let isSuccess = false;
          do {
            await sleep(100);
            isSuccess = await handleFetchEvent();
          } while (isSuccess);
        })()
      } catch (err) {
        console.log(err);
      }
    }

    window.addEventListener('scroll', fetchEventListener);

    return () => {
      window.removeEventListener('scroll', fetchEventListener);
    }
  }, [])

  return (
    <div className="containerMain">
      <div className="containerStory">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            Thư mời điện tử
          </Typography>
          <Tooltip placement='left' title={<Typography fontSize={"1.3rem"}>Tạo sự kiện</Typography>}>
            <IconButton className={styles.btnAddNewEvent} variant="outlined" onClick={() => navigate("/events/create")}>
              <EditCalendarIcon sx={{ fontSize: '40px' }} />
              Thêm
            </IconButton>
          </Tooltip>
        </Stack>

        <Paper
          ref={eventListElement}
          variant="outlined"
          sx={{ marginTop: '20px', borderRadius: '8px', padding: '16px' }}
        >
          {
            isLoading ? (
              <>
                <StorySkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <StorySkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <StorySkeleton />
              </>
            ) : invitations.length <= 0
              ? <> Bạn chưa tạo sự kiện nào </>
              : invitations.map((invitation, index) =>
                <div key={invitation._id}>
                  <InvitationItem invitation={invitation} />
                  {
                    index < invitations.length - 1 ? <Divider light sx={{ margin: '20px 0' }} /> : ""
                  }
                </div>
              )
          }
          {
            isFetching && <Oval
              className={styles.fetchLoading}
              stroke="#ff6541"
              style={{ display: 'block', width: '25px', margin: '5px auto 0' }}
            />
          }
        </ Paper>
      </div>
    </div>
  )
}
