import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import WritingAnimation from "animationData/Writing.json";

const Writing = ({ styles }) => {
  const anime = useRef(null);
  useEffect(() => {
    lottie.loadAnimation({
      container: anime.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: WritingAnimation,
    });
    return () => lottie.destroy();
  }, []);
  return <div style={{ ...styles }} ref={anime}></div>;
};

export default Writing;
