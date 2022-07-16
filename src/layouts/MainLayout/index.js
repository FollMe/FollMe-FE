import { Outlet } from "react-router-dom";
import AuthHeader from "./AuthHeader";

export default function AuthLayout() {
  return (
    <>
      <AuthHeader />
      <Outlet />
    </>
  )
}