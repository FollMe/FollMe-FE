import { lazy, Suspense } from "react";
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
import Home from "pages/main/Home";
import Page404 from "pages/main/Page404";
import BlogList from "pages/blog/BlogList";
import Blog from "pages/blog/Blog";
import OvalLoading from "components/loading/OvalLoading";

// Heavy pages (rich-text editor, data grid, uploader) are split into their own chunks
const CreateBlog = lazy(() => import("pages/blog/CreateBlog"));
const InvitationCard = lazy(() => import("pages/invitation/InvitationCard"));
const InvitationList = lazy(() => import("pages/invitation/InvitationList"));
const Event = lazy(() => import("pages/invitation/Event"));
const CreateEvent = lazy(() => import("pages/invitation/CreateEvent"));

const withSuspense = (element) => (
  <Suspense fallback={<OvalLoading />}>{element}</Suspense>
);

export default function Router() {
  return useRoutes([
    {
      element: <MainLayout hideHeader />,
      children: [
        { path: 'sign-in', element: <SignIn /> },
        { path: 'sign-up', element: <SignUp /> },
        // The e-card has its own full-screen design
        { path: '/invitations/:id', element: withSuspense(<InvitationCard />) },
      ]
    },
    {
      element: <MainLayout />,
      children: [
        { path: '/404', element: <Page404 /> },
        { path: '/documents/facebook-data-deletion-instructions-url', element: <FacebookDataDeletionInstructions /> },
      ]
    },

    // Public routes
    {
      element: <AuthMainLayout />,
      children: [
        { path: '/', element: <Home /> },
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
        { path: '/blogs/create', element: withSuspense(<CreateBlog />) },
        { path: '/events', element: withSuspense(<InvitationList />) },
        { path: '/events/create', element: withSuspense(<CreateEvent />) },
        { path: '/events/:eventId', element: withSuspense(<Event />) },
      ]
    },

    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}
