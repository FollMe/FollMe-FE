import LogoHeader from "components/LogoHeader"
import { Outlet } from "react-router-dom"

export default function MainLayout({ type }) {
    return (
        <>
            <LogoHeader />
            <Outlet />
        </>
    )
}