import LogoHeader from "components/LogoHeader"
import { Outlet } from "react-router-dom"

export default function MainLayout({ hideHeader }) {
  return (
    <>
      {!hideHeader && <LogoHeader />}
      {/* The page's main landmark, for screen readers (no styling) */}
      <main>
        <Outlet />
      </main>
    </>
  )
}
