import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/main/Home";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";

export default function Router() {
  return useRoutes([
    {
      element: <AuthLayout />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> }
      ]
    },
    {
      element: <MainLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/stories', element: <Story /> },
        { path: '/stories/select-chap', element: <SelectChap /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}