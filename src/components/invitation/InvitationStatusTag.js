import clsx from 'clsx';
import styles from './InvitationStatusTag.module.scss';

const STATUS = {
  upcoming: 'Sắp diễn ra',
  happened: 'Đã diễn ra',
};

export default function InvitationStatusTag({ status }) {
  const message = STATUS[status];

  if (!message) {
    return <></>
  }
  return (
    <span className={clsx(styles.tag, styles[status])}>
      {message}
    </span>
  )
}
