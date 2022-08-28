import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import WumpusHiAnimation from "animationData/WumpusHi.json";

const WumpusHi = () => {
  const anime = useRef(null);
  useEffect(() => {
    lottie.loadAnimation({
      container: anime.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: WumpusHiAnimation,
    });
    return () => lottie.destroy();
  }, []);
  return <div style={{ width: 300 }} ref={anime}></div>;
};

export default WumpusHi;