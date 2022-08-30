import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/main/Home";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";
import ShortStory from "pages/story/ShortStory";
import StoryList from "./pages/story/StoryList";
import FacebookDataDeletionInstructions from "pages/document/FacebookDataDeletionInstructions";
import MainLayout from "./layouts/MainLayout";
import { HEADER_TYPE } from "./config/enum";
import Page404 from "pages/main/Page404";

export default function Router() {
    return useRoutes([
        {
            element: <MainLayout />,
            children: [
                { path: 'sign-in', element: <SignIn /> },
                { path: 'sign-up', element: <SignUp /> },
                { path: '/', element: <Home /> },
                { path: '/stories', element: <StoryList /> },
                { path: '/404', element: <Page404 /> }
            ]
        },
        {
            element: <MainLayout type={HEADER_TYPE.MOBILE} />,
            children: [
                { path: '/stories/:storySlug', element: <SelectChap /> },
                { path: '/stories/:storySlug/:chapSlug', element: <Story /> },
                { path: '/short-stories/:storySlug', element: <ShortStory /> },
                { path: '/documents/facebook-data-deletion-instructions-url', element: <FacebookDataDeletionInstructions /> }
            ]
        },
        { path: '*', element: <Navigate to="/404" replace /> }
    ])
}