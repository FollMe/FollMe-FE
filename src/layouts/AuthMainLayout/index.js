import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserInfo } from "customHooks/useUserInfo";
import { useWebSocket } from "customHooks/useWebSocket";
import SiteHeader from "components/layout/SiteHeader";
import Footer from "components/Footer";
import { forceLogin, handleCheckLoggedIn } from "util/authHelper";

export default function AuthMainLayout({ isProtected }) {
  const [userInfo, setUserInfo] = useUserInfo();
  const { wsSend } = useWebSocket();
  const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp)

  useEffect(() => {
    if (!isLoggedIn) {
      setUserInfo({});
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) {
      regisToServer()
    }
  }, [isLoggedIn, wsSend])

  async function regisToServer() {
    try {
      wsSend({
        message: userInfo._id,
        action: "join"
      })
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
      <SiteHeader isLoggedIn={isLoggedIn} userInfo={userInfo} />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
