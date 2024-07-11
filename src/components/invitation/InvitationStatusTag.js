import styles from './InvitationItem.module.scss';

export default function InvitationStatusTag({ status }) {
  let message, backgroundColor;
  switch (status) {
    case 'upcoming':
      message = 'Sắp diễn ra';
      backgroundColor = '#f59e0c'
      break;
      case 'happened':  
      backgroundColor = '#737373'
      message = 'Đã diễn ra';
      break;
    default:
  }

  if (!message) {
    return <></>
  }
  return (
    <span
      className={styles.storyContentHeader_tag}
      style={{ backgroundColor }}
    >
      {message}
    </span>
  )
}
