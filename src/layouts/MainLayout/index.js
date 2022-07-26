import { Outlet } from "react-router-dom"
import Header from "../../components/Header"

export default function MainLayout({ type }) {
  return (
    <>
      <Header type={type} />
      <Outlet />
    </>
  )
}