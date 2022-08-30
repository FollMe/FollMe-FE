import React, { useEffect, useRef } from "react";
import { loadAnimation, destroy } from "lottie-web";
import page404Animation from "animationData/Page404.json";

const Animation404 = () => {
  const anime = useRef(null);
  useEffect(() => {
    loadAnimation({
      container: anime.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: page404Animation,
    });
    return () => destroy();
  }, []);
  return <div style={{ width: 300 }} ref={anime}></div>;
};

export default Animation404;