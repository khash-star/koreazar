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
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    // Handle /admin -> AdminPanel
    if (urlLastPart.toLowerCase() === 'admin') {
        return 'AdminPanel';
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Scroll to top when route changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);
    
    // Login болон Register хуудсууд Layout-аас гадуур байх
    const isAuthPage = currentPage === 'Login' || currentPage === 'Register';
    
    return (
        <>
            <Routes>
                {/* All pages with Layout */}
                <Route path="/" element={<Layout currentPageName={currentPage}><Home /></Layout>} />
                <Route path="/Home" element={<Layout currentPageName={currentPage}><Home /></Layout>} />
                <Route path="/AdminAllListings" element={<Layout currentPageName={currentPage}><AdminAllListings /></Layout>} />
                <Route path="/AdminBannerRequests" element={<Layout currentPageName={currentPage}><AdminBannerRequests /></Layout>} />
                <Route path="/AdminBanners" element={<Layout currentPageName={currentPage}><AdminBanners /></Layout>} />
                <Route path="/AdminNewListings" element={<Layout currentPageName={currentPage}><AdminNewListings /></Layout>} />
                <Route path="/AdminPanel" element={<Layout currentPageName={currentPage}><AdminPanel /></Layout>} />
                <Route path="/admin" element={<Layout currentPageName={currentPage}><AdminPanel /></Layout>} />
                <Route path="/CreateListing" element={<Layout currentPageName={currentPage}><CreateListing /></Layout>} />
                <Route path="/EditListing" element={<Layout currentPageName={currentPage}><EditListing /></Layout>} />
                <Route path="/ListingDetail" element={<Layout currentPageName={currentPage}><ListingDetail /></Layout>} />
                <Route path="/MyListings" element={<Layout currentPageName={currentPage}><MyListings /></Layout>} />
                <Route path="/RequestBannerAd" element={<Layout currentPageName={currentPage}><RequestBannerAd /></Layout>} />
                <Route path="/requestbannerad" element={<Layout currentPageName={currentPage}><RequestBannerAd /></Layout>} />
                <Route path="/SavedListings" element={<Layout currentPageName={currentPage}><SavedListings /></Layout>} />
                <Route path="/UpgradeListing" element={<Layout currentPageName={currentPage}><UpgradeListing /></Layout>} />
                <Route path="/Messages" element={<Layout currentPageName={currentPage}><Messages /></Layout>} />
                <Route path="/Chat" element={<Layout currentPageName={currentPage}><Chat /></Layout>} />
            </Routes>
        </>
    );
}

export default function Pages() {
    return (
        <Router>
            <Routes>
                {/* Auth pages first - before any base44 SDK imports */}
                <Route path="/Login" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/register" element={<Register />} />
                
                {/* All other routes */}
                <Route path="/*" element={<PagesContent />} />
            </Routes>
        </Router>
    );
}