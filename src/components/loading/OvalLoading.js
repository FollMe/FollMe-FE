import CircularProgress from '@mui/material/CircularProgress';

function OvalLoading() {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        width: '100%',
        height: '100%',
        minHeight: '240px',
        top: '0',
        left: '0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress size={36} thickness={4} />
    </div>
  );
}

export default OvalLoading;
