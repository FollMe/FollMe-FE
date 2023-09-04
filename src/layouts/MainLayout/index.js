import LogoHeader from "components/LogoHeader"
import { useEffect } from "react"
import { Outlet } from "react-router-dom"

export default function MainLayout({ type }) {
  useEffect(() => {
    document.documentElement.scrollTo(0, 0);
  }, [])

  return (
    <>
      <LogoHeader />
      <Outlet />
    </>
  )
}