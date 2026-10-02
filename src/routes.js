import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import SelectChap from "./pages/story/SelectChap";
import Story from "./pages/story/Story";
import ShortStory from "pages/story/ShortStory";
import StoryList from "./pages/story/StoryList";
import FacebookDataDeletionInstructions from "pages/document/FacebookDataDeletionInstructions";
import PrivacyPolicy from "pages/document/PrivacyPolicy";
import MainLayout from "./layouts/MainLayout";
import AuthMainLayout from "layouts/AuthMainLayout";
import Home from "pages/main/Home";
import Page404 from "pages/main/Page404";
import BlogList from "pages/blog/BlogList";
import Blog from "pages/blog/Blog";
import OvalLoading from "components/loading/OvalLoading";

// Heavy pages (rich-text editor, date picker, uploader) are split into their own chunks
const CreateBlog = lazy(() => import("pages/blog/CreateBlog"));
const InvitationCard = lazy(() => import("pages/invitation/InvitationCard"));
const InvitationList = lazy(() => import("pages/invitation/InvitationList"));
const Event = lazy(() => import("pages/invitation/Event"));
const CreateEvent = lazy(() => import("pages/invitation/CreateEvent"));
const FortuneHome = lazy(() => import("pages/fortune/FortuneHome"));
const Numerology = lazy(() => import("pages/fortune/Numerology"));
const TuVi = lazy(() => import("pages/fortune/TuVi"));
const FortuneProfiles = lazy(() => import("pages/fortune/Profiles"));
const Almanac = lazy(() => import("pages/fortune/Almanac"));
const Compat = lazy(() => import("pages/fortune/Compat"));
const ReadingListPage = lazy(() => import("pages/reading/ReadingListPage"));
const WeddingHub = lazy(() => import("pages/wedding/WeddingHub"));
const ChooseDate = lazy(() => import("pages/wedding/ChooseDate"));
const PublicInvitation = lazy(() => import("pages/invitation/PublicInvitation"));
const DemoInvitation = lazy(() => import("pages/invitation/DemoInvitation"));
const LiveScreen = lazy(() => import("pages/invitation/LiveScreen"));

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
        { path: '/e/:eventId', element: withSuspense(<PublicInvitation />) },
        { path: '/thiep-mau', element: withSuspense(<DemoInvitation />) },
        { path: '/thiep-mau/:theme', element: withSuspense(<DemoInvitation />) },
        // The wishes wall shown on a TV at the party
        { path: '/man-hinh/mau', element: withSuspense(<LiveScreen demo />) },
        { path: '/man-hinh/:eventId/:key', element: withSuspense(<LiveScreen />) },
      ]
    },
    {
      element: <MainLayout />,
      children: [
        { path: '/404', element: <Page404 /> },
        { path: '/documents/facebook-data-deletion-instructions-url', element: <FacebookDataDeletionInstructions /> },
        { path: '/chinh-sach-bao-mat', element: <PrivacyPolicy /> },
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
        { path: '/fortune', element: withSuspense(<FortuneHome />) },
        { path: '/fortune/numerology', element: withSuspense(<Numerology />) },
        { path: '/fortune/tu-vi', element: withSuspense(<TuVi />) },
        { path: '/fortune/lich', element: withSuspense(<Almanac />) },
        { path: '/fortune/hop-tuoi', element: withSuspense(<Compat />) },
        { path: '/doc-sau', element: withSuspense(<ReadingListPage />) },
        { path: '/cuoi-hoi', element: withSuspense(<WeddingHub />) },
        { path: '/cuoi-hoi/chon-ngay', element: withSuspense(<ChooseDate />) },
      ]
    },

    // Protected routes
    {
      element: <AuthMainLayout isProtected={true} />,
      children: [
        { path: '/blogs/create', element: withSuspense(<CreateBlog />) },
        { path: '/blogs/:blogSlug/edit', element: withSuspense(<CreateBlog key="edit" />) },
        { path: '/events', element: withSuspense(<InvitationList />) },
        { path: '/events/create', element: withSuspense(<CreateEvent />) },
        { path: '/events/:eventId/edit', element: withSuspense(<CreateEvent key="edit" />) },
        { path: '/events/:eventId', element: withSuspense(<Event />) },
        { path: '/fortune/profiles', element: withSuspense(<FortuneProfiles />) },
      ]
    },

    { path: '*', element: <Navigate to="/404" replace /> }
  ])
}
