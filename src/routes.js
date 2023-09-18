import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";
import ShortStory from "pages/story/ShortStory";
import StoryList from "./pages/story/StoryList";
import FacebookDataDeletionInstructions from "pages/document/FacebookDataDeletionInstructions";
import MainLayout from "./layouts/MainLayout";
import AuthMainLayout from "layouts/AuthMainLayout";
import { HEADER_TYPE } from "./config/enum";
import Page404 from "pages/main/Page404";
import BlogList from "pages/blog/BlogList";
import CreateBlog from "pages/blog/CreateBlog";
import Blog from "pages/blog/Blog";
import InvitationCard from "pages/invitation/InvitationCard";

export default function Router() {
  return useRoutes([
    {
      element: <MainLayout />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> },
        { path: '/404', element: <Page404 /> }
      ]
    },
    {
      element: <MainLayout type={HEADER_TYPE.MOBILE} />,
      children: [
        { path: '/documents/facebook-data-deletion-instructions-url', element: <FacebookDataDeletionInstructions /> },
        { path: '/invitation/:id', element: <InvitationCard /> }
      ]
    },

    // Public routes
    {
      element: <AuthMainLayout />,
      children: [
        { path: '/', element: <Navigate to="/stories" replace /> },
        { path: '/stories', element: <StoryList /> },
        { path: '/stories/long-stories/:storySlug', element: <SelectChap /> },
        { path: '/stories/long-stories/:storySlug/:chapSlug', element: <Story /> },
        { path: '/stories/short-stories/:storySlug', element: <ShortStory /> },
        { path: '/blogs', element: <BlogList /> },
        { path: '/blogs/:blogSlug', element: <Blog /> },
      ]
    },

    // Protected routes
    {
      element: <AuthMainLayout isProtected={true} />,
      children: [
        { path: '/blogs/create', element: <CreateBlog /> },
      ]
    },

    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}