import { Outlet } from "react-router-dom"
import AuthHeader from "../../components/AuthHeader"

export default function AuthLayout() {
  return (
    <>
      <AuthHeader />
      <Outlet />
    </>
  )
}