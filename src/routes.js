import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/main/Home";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";
import MainLayout from "./layouts/MainLayout";
import { HEADER_TYPE } from "./config/enum";

export default function Router() {
  return useRoutes([
    {
      element: <MainLayout />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> },
        { path: '/', element: <Home /> },
        { path: '/stories', element: <Story /> },
      ]
    },
    {
      element: <MainLayout type={HEADER_TYPE.MOBILE} />,
      children: [
        { path: '/stories/select-chap', element: <SelectChap /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}