import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvitationLoading from 'components/invitation/InvitationLoading';
import InvitationUnavailable from 'components/invitation/InvitationUnavailable';
import InvitationView from 'components/invitation/InvitationView';
import { eventHeadline, getPublicGuest, invitationApi, isGoneError, savePublicGuest } from 'util/invitation';
import { setPageMeta } from 'util/meta';

/** The shared link of an event (/e/:eventId), for group chats. */
export default function PublicInvitation() {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [guest, setGuest] = useState(() => getPublicGuest(eventId));
  const [failed, setFailed] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    setFailed(null);
    invitationApi.getPublic(eventId, { quiet: true })
      .then(res => {
        if (!isActive) {
          return;
        }
        setPageMeta({ title: `Thiệp mời: ${eventHeadline(res.event)}`, description: res.event.location });
        setData(res);
      })
      .catch(err => isActive && setFailed(isGoneError(err) ? 'missing' : 'offline'));
    return () => {
      isActive = false;
    };
  }, [eventId, attempt]);

  if (failed) {
    return <InvitationUnavailable reason={failed} isPublic onRetry={() => setAttempt(n => n + 1)} />;
  }
  if (!data) {
    return <InvitationLoading />;
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
