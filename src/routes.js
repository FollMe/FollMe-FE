import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/main/Home";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";
import StoryList from "./pages/story/StoryList";
import FacebookDataDeletionInstructions from "pages/document/FacebookDataDeletionInstructions";
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
                { path: '/stories', element: <StoryList /> },
            ]
        },
        {
            element: <MainLayout type={HEADER_TYPE.MOBILE} />,
            children: [
                { path: '/stories/select-chap', element: <SelectChap /> },
                { path: '/stories/:nameSlug', element: <Story /> },
                { path: '/documents/facebook-data-deletion-instructions-url', element: <FacebookDataDeletionInstructions /> }
            ]
        },
        { path: '*', element: <Navigate to="/404" replace /> }
    ])
}