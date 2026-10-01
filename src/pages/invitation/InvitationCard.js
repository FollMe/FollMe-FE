import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvitationLoading from 'components/invitation/InvitationLoading';
import InvitationView from 'components/invitation/InvitationView';
import { eventHeadline, invitationApi } from 'util/invitation';
import { setPageMeta } from 'util/meta';

/** A guest's personal invitation (/invitations/:id). */
export default function InvitationCard() {
  const { id: guestId } = useParams();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isActive = true;
    invitationApi.get(guestId)
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
      .catch(() => isActive && setFailed(true));
    return () => {
      isActive = false;
    };
  }, [guestId]);

  if (failed) {
    return <div className="container page empty-state">Không tìm thấy thiệp mời này.</div>;
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
