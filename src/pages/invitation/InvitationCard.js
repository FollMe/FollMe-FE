import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvitationLoading from 'components/invitation/InvitationLoading';
import InvitationUnavailable from 'components/invitation/InvitationUnavailable';
import InvitationView from 'components/invitation/InvitationView';
import { eventHeadline, invitationApi, isGoneError } from 'util/invitation';
import { setPageMeta } from 'util/meta';

/** A guest's personal invitation (/invitations/:id). */
export default function InvitationCard() {
  const { id: guestId } = useParams();
  const [data, setData] = useState(null);
  // 'missing' (link no longer works) or 'offline' (could not load it)
  const [failed, setFailed] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    setFailed(null);
    invitationApi.get(guestId, { quiet: true })
      .then(res => {
        if (!isActive) {
          return;
        }
        const invitation = res.invitation;
        setPageMeta({
          title: `Thiệp mời: ${eventHeadline(invitation.event)}`,
          description: `${invitation.name ? `Gửi ${invitation.name}. ` : ''}${invitation.event.location}`,
        });
        setData(invitation);
      })
      .catch(err => isActive && setFailed(isGoneError(err) ? 'missing' : 'offline'));
    return () => {
      isActive = false;
    };
  }, [guestId, attempt]);

  if (failed) {
    return <InvitationUnavailable reason={failed} onRetry={() => setAttempt(n => n + 1)} />;
  }
  if (!data) {
    return <InvitationLoading />;
  }

  const { event, wishes, ...guest } = data;
  return (
    <InvitationView
      event={event}
      guest={guest}
      wishes={wishes}
      onGuestChange={next => setData(d => ({ ...d, rsvp: next.rsvp }))}
    />
  );
}
