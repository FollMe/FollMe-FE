import { lazy, Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthMainLayout from "layouts/AuthMainLayout";
import Home from "pages/main/Home";
import Page404 from "pages/main/Page404";
import OvalLoading from "components/loading/OvalLoading";

// Every page but the home page is its own chunk: a guest opening an
// invitation from Zalo downloads the invitation, not the blog or stories.
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const SelectChap = lazy(() => import("./pages/story/SelectChap"));
const Story = lazy(() => import("./pages/story/Story"));
const ShortStory = lazy(() => import("pages/story/ShortStory"));
const StoryList = lazy(() => import("./pages/story/StoryList"));
const FacebookDataDeletionInstructions = lazy(() => import("pages/document/FacebookDataDeletionInstructions"));
const PrivacyPolicy = lazy(() => import("pages/document/PrivacyPolicy"));
const BlogList = lazy(() => import("pages/blog/BlogList"));
const Blog = lazy(() => import("pages/blog/Blog"));
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
        { path: 'sign-in', element: withSuspense(<SignIn />) },
        { path: 'sign-up', element: withSuspense(<SignUp />) },
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
        { path: '/documents/facebook-data-deletion-instructions-url', element: withSuspense(<FacebookDataDeletionInstructions />) },
        { path: '/chinh-sach-bao-mat', element: withSuspense(<PrivacyPolicy />) },
      ]
    },

    // Public routes
    {
      element: <AuthMainLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/stories', element: withSuspense(<StoryList />) },
        { path: '/stories/long-stories/:storySlug', element: withSuspense(<SelectChap />) },
        { path: '/stories/long-stories/:storySlug/:chapSlug', element: withSuspense(<Story />) },
        { path: '/stories/short-stories/:storySlug', element: withSuspense(<ShortStory />) },
        { path: '/blogs', element: withSuspense(<BlogList />) },
        { path: '/blogs/:blogSlug', element: withSuspense(<Blog />) },
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
