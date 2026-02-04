import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
            {/* Background ambient lights */}
            <div className="fixed top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-[color:var(--accent-purple)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none animate-pulse-slow"></div>
            <div className="fixed bottom-[10%] right-[-5%] w-[40vh] h-[40vh] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"></div>

            {/* Main Content Area */}
            <main className="w-full max-w-md flex-1 pb-32 px-5 pt-8 z-10">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};

export default Layout;
