import Layout from "./Layout.jsx";

import AdminAllListings from "./AdminAllListings";

import AdminBannerRequests from "./AdminBannerRequests";

import AdminBanners from "./AdminBanners";

import AdminNewListings from "./AdminNewListings";

import AdminPanel from "./AdminPanel";

import CreateListing from "./CreateListing";

import EditListing from "./EditListing";

import Home from "./Home";

import ListingDetail from "./ListingDetail";

import MyListings from "./MyListings";

import RequestBannerAd from "./RequestBannerAd";

import SavedListings from "./SavedListings";

import UpgradeListing from "./UpgradeListing";

import Messages from "./Messages";

import Chat from "./Chat";

import Login from "./Login";

import Register from "./Register";

import Profile from "./Profile";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const PAGES = {
    
    AdminAllListings: AdminAllListings,
    
    AdminBannerRequests: AdminBannerRequests,
    
    AdminBanners: AdminBanners,
    
    AdminNewListings: AdminNewListings,
    
    AdminPanel: AdminPanel,
    
    CreateListing: CreateListing,
    
    EditListing: EditListing,
    
    Home: Home,
    
    ListingDetail: ListingDetail,
    
    MyListings: MyListings,
    
    RequestBannerAd: RequestBannerAd,
    
    SavedListings: SavedListings,
    
    UpgradeListing: UpgradeListing,
    
    Messages: Messages,
    
    Chat: Chat,
    
    Login: Login,
    
    Register: Register,
    
    Profile: Profile,
    
}

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
            
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}