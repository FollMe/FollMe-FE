import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import TypingAnimation from "animationData/Typing.json";

const Typing = ({ width }) => {
  const anime = useRef(null);
  useEffect(() => {
    lottie.loadAnimation({
      container: anime.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: TypingAnimation,
    });
    return () => lottie.destroy();
  }, []);
  return <div style={{ width: width ?? 50 }} ref={anime}></div>;
};

export default Typing;
