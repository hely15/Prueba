import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Target, Wallet } from 'lucide-react';

const BottomNav = () => {
    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Inicio' },
        { path: '/transactions', icon: ArrowRightLeft, label: 'Movimientos' },
        { path: '/goals', icon: Target, label: 'Metas' },
        // { path: '/budget', icon: Wallet, label: 'Presupuesto' }, 
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2">
            <div className="glass-panel rounded-2xl flex justify-between items-center px-6 py-3 mx-auto max-w-md shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
              ${isActive
                                ? 'text-[color:var(--accent-purple)] scale-110 drop-shadow-[0_0_8px_rgba(189,0,255,0.6)]'
                                : 'text-gray-400 hover:text-white'}
            `}
                    >
                        <item.icon size={24} strokeWidth={item.path === location.pathname ? 2.5 : 2} />
                        <span className="text-[10px] mt-1 font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
