import { Outlet, Navigate } from "react-router-dom";
import Header from "../../components/Header";
import { useUserInfo } from "customHooks/useUserInfo";
import { useEffect } from "react";

export default function AuthMainLayout({ type }) {
    const [userInfo, setUserInfo] = useUserInfo();
    const now = new Date().getTime();
    const isLoggedIn = userInfo.sessionExp && now <= userInfo.sessionExp * 1000;

    useEffect(() => {
        if (!isLoggedIn) {
            setUserInfo({});
        }
    }, [isLoggedIn])
    
    if (!isLoggedIn) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.sessionStorage.setItem('redirect', window.location.pathname);
        return <Navigate to='/sign-in' />
    }

    return (
        <>
            <Header type={type} />
            <Outlet />
        </>
    )
}