import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ECardLoading } from 'components/loading/ECardLoading';
import InvitationView from 'components/invitation/InvitationView';
import { eventHeadline, getPublicGuest, invitationApi, savePublicGuest } from 'util/invitation';
import { setPageMeta } from 'util/meta';

/** The shared link of an event (/e/:eventId), for group chats. */
export default function PublicInvitation() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [guest, setGuest] = useState(() => getPublicGuest(eventId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isActive = true;
    invitationApi.getPublic(eventId)
      .then(res => {
        if (!isActive) {
          return;
        }
        setPageMeta({ title: `Thiệp mời: ${eventHeadline(res.event)}`, description: res.event.location });
        setData(res);
      })
      .catch(() => isActive && setFailed(true));
    return () => {
      isActive = false;
    };
  }, [eventId]);

  if (failed) {
    return <div className="container page empty-state">Thiệp mời này không tồn tại hoặc gia chủ đã tắt link chung.</div>;
  }
  if (!data) {
    return <ECardLoading />;
  }
  return (
    <InvitationView
      event={data.event}
      wishes={data.wishes}
      guest={guest}
      isPublic
      onGuestChange={next => {
        setGuest(next);
        savePublicGuest(eventId, next);
      }}
    />
  );
}
