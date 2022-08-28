import WumpusHi from './animations/WumpusHi';

function WumpusHiLoading() {
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
      <WumpusHi />
    </div>
  );
}

export default WumpusHiLoading;