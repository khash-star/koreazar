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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AdminAllListings />} />
                
                
                <Route path="/AdminAllListings" element={<AdminAllListings />} />
                
                <Route path="/AdminBannerRequests" element={<AdminBannerRequests />} />
                
                <Route path="/AdminBanners" element={<AdminBanners />} />
                
                <Route path="/AdminNewListings" element={<AdminNewListings />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/CreateListing" element={<CreateListing />} />
                
                <Route path="/EditListing" element={<EditListing />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ListingDetail" element={<ListingDetail />} />
                
                <Route path="/MyListings" element={<MyListings />} />
                
                <Route path="/RequestBannerAd" element={<RequestBannerAd />} />
                
                <Route path="/SavedListings" element={<SavedListings />} />
                
                <Route path="/UpgradeListing" element={<UpgradeListing />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Chat" element={<Chat />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}