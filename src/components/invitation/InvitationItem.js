import { IoPeopleOutline, IoLocationOutline, IoCalendarOutline } from "react-icons/io5";
import dayjs from 'dayjs';
import PostCard from 'components/cards/PostCard';
import InvitationStatusTag from './InvitationStatusTag';
import { cldUrl } from 'util/photos';
import { vnWallClock } from 'util/date';
import { isOwnEvent } from 'util/invitation';
import { useUserInfo } from 'customHooks/useUserInfo';

export default function InvitationItem({ invitation, style }) {
  const { title, location, startAt, numGuests } = invitation;
  const status = new Date(startAt) > new Date() ? 'upcoming' : 'happened';
  const cover = invitation.photos?.[0];
  const [userInfo] = useUserInfo();
  // Someone else's event the user manages with them
  const shared = !isOwnEvent(invitation, userInfo._id);

  return (
    <PostCard
      to={`/events/${invitation._id}`}
      image={cover ? cldUrl(cover.url, 'w_640,h_400,c_fill,g_faces') : null}
      badge={shared ? 'Cùng quản lý' : null}
      aside={<InvitationStatusTag status={status} />}
      title={title}
      stats={[
        { icon: <IoCalendarOutline />, label: dayjs(vnWallClock(startAt)).format('HH:mm · DD/MM/YYYY'), title: 'Thời gian' },
        { icon: <IoLocationOutline />, label: location, title: 'Địa điểm' },
        { icon: <IoPeopleOutline />, label: numGuests ?? "…", title: 'Khách mời' },
      ]}
      style={style}
    />
  )
}
