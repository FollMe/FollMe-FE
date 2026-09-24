import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { IoAdd } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import { PostCardSkeleton } from 'components/cards/PostCard';
import InvitationItem from 'components/invitation/InvitationItem';
import { request } from 'util/request';
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
    document.title = "Thư mời | FollMe";
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
    <div className="container page">
      <PageHeader
        eyebrow="Thư mời điện tử"
        title="Sự kiện của bạn"
        description="Tạo sự kiện, gửi thư mời đến từng khách mời qua email và theo dõi ai đã xem thư mời."
        actions={
          <Button variant="contained" size="large" startIcon={<IoAdd />} onClick={() => navigate("/events/create")}>
            Tạo sự kiện
          </Button>
        }
      />

      <div ref={eventListElement}>
        {
          isLoading ? (
            <div className="card-grid">
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : invitations.length <= 0 ? (
            <div className="empty-state">
              Bạn chưa tạo sự kiện nào.{' '}
              <Button variant="text" onClick={() => navigate("/events/create")}>Tạo sự kiện đầu tiên →</Button>
            </div>
          ) : (
            <div className="card-grid stagger">
              {invitations.map(invitation =>
                <InvitationItem key={invitation._id} invitation={invitation} />
              )}
            </div>
          )
        }
        {
          isFetching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <CircularProgress size={26} />
            </div>
          )
        }
      </div>
    </div>
  )
}
