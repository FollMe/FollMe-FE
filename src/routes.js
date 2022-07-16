import { Navigate, useRoutes } from "react-router-dom";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/main/Home";
import SelectChap from "./pages/story/SelectChap";

export default function Router() {
  return useRoutes([
    {
      element: <AuthLayout />,
      children: [
        { path: 'login', element: <Login /> },
        { path: 'sign-up', element: <SignUp /> }
      ]
    },
    {
      element: <MainLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/story', element: <SelectChap /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}