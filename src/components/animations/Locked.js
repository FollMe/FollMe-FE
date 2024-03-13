import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import LockedAnimation from "animationData/Locked.json";

const Locked = ({ styles }) => {
  const anime = useRef(null);
  useEffect(() => {
    lottie.loadAnimation({
      container: anime.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: LockedAnimation,
    });
    return () => lottie.destroy();
  }, []);
  return <div style={{ ...styles }} ref={anime}></div>;
};

export default Locked;
