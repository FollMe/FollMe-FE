import styles from './ECardLoading.module.css'

export function ECardLoading() {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: '0',
        left: '0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
      <div
        className={styles.mask}
        style={{
          position: 'fixed',
          width: '50%',
          height: '4rem',
          zIndex: '1',
          backgroundColor: '#f9fafb',
          left: '-110px'
        }}
      ></div>
      <div style={{ display: 'flex', alignItems: 'center'}}>
        <img className={styles.icon} src="/imgs/follme-logo.png" alt="FollMe Logo" style={{ width: '7rem', zIndex: 2 }} />
        <span
          className={styles.text}
          style={{
            display: 'inline-block',
            fontWeight: 'bold',
            fontSize: '3rem',
            marginLeft: '8px'
          }}
        >FollMe.eCard</span>
      </div>
    </div>
  );
}
