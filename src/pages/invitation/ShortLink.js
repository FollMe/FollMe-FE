import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvitationLoading from 'components/invitation/InvitationLoading';
import InvitationUnavailable from 'components/invitation/InvitationUnavailable';
import { invitationApi, isGoneError } from 'util/invitation';
import PublicInvitation from './PublicInvitation';

/** A short link (/c/minh-lan): the shared card of the event it names, at that address. */
export default function ShortLink() {
  const { slug } = useParams();
  const [eventId, setEventId] = useState(null);
  const [failed, setFailed] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    setFailed(null);
    invitationApi.bySlug(slug.toLowerCase(), { quiet: true })
      .then(res => isActive && setEventId(res._id))
      .catch(err => isActive && setFailed(isGoneError(err) ? 'missing' : 'offline'));
    return () => {
      isActive = false;
    };
  }, [slug, attempt]);

  if (failed) {
    return <InvitationUnavailable reason={failed} isPublic onRetry={() => setAttempt(n => n + 1)} />;
  }
  if (!eventId) {
    return <InvitationLoading />;
  }
  return <PublicInvitation eventId={eventId} />;
}
