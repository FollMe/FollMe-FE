import { Oval } from 'react-loading-icons'

function OvalLoading() {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        width: '100%',
        height: '100vh',
        top: '0',
        left: '0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Oval stroke="#ff6541" />
    </div>
  );
}

export default OvalLoading;
