import LottieAnimation from './LottieAnimation';

const load = () => import('animationData/Typing.json');

const Typing = ({ width }) => <LottieAnimation load={load} style={{ width: width ?? 50 }} />;

export default Typing;
