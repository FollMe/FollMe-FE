import LottieAnimation from './LottieAnimation';

const load = () => import('animationData/Locked.json');

const Locked = ({ styles }) => <LottieAnimation load={load} style={styles} />;

export default Locked;
