import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Header from "../../components/Header";
import { useUserInfo } from "customHooks/useUserInfo";
import { useEffect } from "react";
import SideDrawer from "components/sidebar/SideDrawer";
import { useWebSocket } from "customHooks/useWebSocket";
import { waitConnectWS } from "util/handleWebSocket";
import Footer from "components/Footer";
import { forceLogin, handleCheckLoggedIn } from "util/authHelper";


const MOBILE_MAX_WIDTH = 760;

export default function AuthMainLayout({ type, isProtected }) {
  const [userInfo, setUserInfo] = useUserInfo();
  const [ws] = useWebSocket();
  const [isOpenSideDrawer, setIsOpenSideDrawer] = useState(window.innerWidth > MOBILE_MAX_WIDTH);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_MAX_WIDTH);
  const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp)

  useEffect(() => {
    if (!isLoggedIn) {
      setUserInfo({});
    }

    if (isLoggedIn) {
      regisToServer()
    }

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    }
  }, [isLoggedIn])


  function resize() {
    setIsMobile(isMobile => {
      const newIsMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
      if (isOpenSideDrawer && !isMobile && newIsMobile) {
        setIsOpenSideDrawer(false);
      }
      return newIsMobile;
    });
  }

  async function regisToServer() {
    try {
      await waitConnectWS(ws)
      ws.send(JSON.stringify({
        message: userInfo._id,
        action: "join"
      }))
    } catch (err) {
      console.log(err)
    }
  }

  if (!isLoggedIn && isProtected) {
    forceLogin();
    return <Navigate to='/sign-in' />
  }

  return (
    <>
      <Header type={type} setIsOpenSideDrawer={setIsOpenSideDrawer} />
      <div className="root-content">
        <SideDrawer
          setIsOpenSideDrawer={setIsOpenSideDrawer}
          isOpenSideDrawer={isOpenSideDrawer}
          isMobile={isMobile}
          isLoggedIn={isLoggedIn}
        />
        <Outlet />
      </div>
      <Footer />
    </>
  )
}
