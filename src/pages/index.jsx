import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Layout from "./Layout.jsx";
import Home from "./Home";

const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const AdminAllListings = lazy(() => import('./AdminAllListings'));
const AdminBannerRequests = lazy(() => import('./AdminBannerRequests'));
const AdminBanners = lazy(() => import('./AdminBanners'));
const AdminNewListings = lazy(() => import('./AdminNewListings'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const CreateListing = lazy(() => import('./CreateListing'));
const EditListing = lazy(() => import('./EditListing'));
const ListingDetail = lazy(() => import('./ListingDetail'));
const MyListings = lazy(() => import('./MyListings'));
const RequestBannerAd = lazy(() => import('./RequestBannerAd'));
const SavedListings = lazy(() => import('./SavedListings'));
const UpgradeListing = lazy(() => import('./UpgradeListing'));
const Messages = lazy(() => import('./Messages'));
const Chat = lazy(() => import('./Chat'));
const Profile = lazy(() => import('./Profile'));
const Privacy = lazy(() => import('./Privacy'));

const PAGES = {
  AdminAllListings,
  AdminBannerRequests,
  AdminBanners,
  AdminNewListings,
  AdminPanel,
  CreateListing,
  EditListing,
  Home,
  ListingDetail,
  MyListings,
  RequestBannerAd,
  SavedListings,
  UpgradeListing,
  Messages,
  Chat,
  Login,
  Register,
  Profile,
  Privacy
};

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'Home';
}

// Wrapper component for pages that need Layout
function LayoutWrapper({ children, currentPageName }) {
    return <Layout currentPageName={currentPageName}>{children}</Layout>;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Scroll to top when route changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);
    
    return (
        <Routes>
            {/* Login and Register pages without Layout */}
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            
            {/* All other pages with Layout */}
            <Route path="/" element={<LayoutWrapper currentPageName="Home"><Home /></LayoutWrapper>} />
            
            <Route path="/AdminAllListings" element={<LayoutWrapper currentPageName={currentPage}><AdminAllListings /></LayoutWrapper>} />
            
            <Route path="/AdminBannerRequests" element={<LayoutWrapper currentPageName={currentPage}><AdminBannerRequests /></LayoutWrapper>} />
            
            <Route path="/AdminBanners" element={<LayoutWrapper currentPageName={currentPage}><AdminBanners /></LayoutWrapper>} />
            
            <Route path="/AdminNewListings" element={<LayoutWrapper currentPageName={currentPage}><AdminNewListings /></LayoutWrapper>} />
            
            <Route path="/AdminPanel" element={<LayoutWrapper currentPageName={currentPage}><AdminPanel /></LayoutWrapper>} />
            
            <Route path="/CreateListing" element={<LayoutWrapper currentPageName={currentPage}><CreateListing /></LayoutWrapper>} />
            
            <Route path="/EditListing" element={<LayoutWrapper currentPageName={currentPage}><EditListing /></LayoutWrapper>} />
            
            <Route path="/Home" element={<LayoutWrapper currentPageName={currentPage}><Home /></LayoutWrapper>} />
            
            <Route path="/ListingDetail" element={<LayoutWrapper currentPageName={currentPage}><ListingDetail /></LayoutWrapper>} />
            
            <Route path="/MyListings" element={<LayoutWrapper currentPageName={currentPage}><MyListings /></LayoutWrapper>} />
            
            <Route path="/RequestBannerAd" element={<LayoutWrapper currentPageName={currentPage}><RequestBannerAd /></LayoutWrapper>} />
            
            <Route path="/SavedListings" element={<LayoutWrapper currentPageName={currentPage}><SavedListings /></LayoutWrapper>} />
            
            <Route path="/UpgradeListing" element={<LayoutWrapper currentPageName={currentPage}><UpgradeListing /></LayoutWrapper>} />
            
            <Route path="/Messages" element={<LayoutWrapper currentPageName={currentPage}><Messages /></LayoutWrapper>} />
            
            <Route path="/Chat" element={<LayoutWrapper currentPageName={currentPage}><Chat /></LayoutWrapper>} />
            
            <Route path="/Profile" element={<LayoutWrapper currentPageName={currentPage}><Profile /></LayoutWrapper>} />
            
            <Route path="/Privacy" element={<LayoutWrapper currentPageName={currentPage}><Privacy /></LayoutWrapper>} />
            
        </Routes>
    );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Pages() {
  return (
    <Router>
      <Suspense fallback={<PageFallback />}>
        <PagesContent />
      </Suspense>
    </Router>
  );
}