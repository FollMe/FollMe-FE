import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Header from "../../components/Header";
import { useUserInfo } from "customHooks/useUserInfo";
import { useEffect } from "react";
import SideDrawer from "components/sidebar/SideDrawer";


const MOBILE_MAX_WIDTH = 760;

export default function AuthMainLayout({ type }) {
    const [userInfo, setUserInfo] = useUserInfo();
    const [isOpenSideDrawer, setIsOpenSideDrawer] = useState(window.innerWidth > MOBILE_MAX_WIDTH);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_MAX_WIDTH);

    const now = new Date().getTime();
    const isLoggedIn = userInfo.sessionExp && now <= userInfo.sessionExp * 1000;

    useEffect(() => {
        if (!isLoggedIn) {
            setUserInfo({});
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
    
    if (!isLoggedIn) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.sessionStorage.setItem('redirect', window.location.pathname);
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
                />
                <Outlet />
            </div>
        </>
    )
}