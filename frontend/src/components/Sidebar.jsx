import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    FileText,
    Users,
    Settings,
    HelpCircle,
    Zap,
    LineChart,
    ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: TrendingUp, label: 'Market Trends', path: '/market-trends' },
        { icon: BarChart3, label: 'Sentiment Analysis', path: '/sentiment' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: ShieldCheck, label: 'Admin Panel', path: '/admin' },
    ];

    const supportItems = [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: HelpCircle, label: 'Help Center', path: '/help' },
    ];

    return (
        <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-background-dark hidden md:flex flex-col h-screen sticky top-0">
            <div className="p-8 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                    <LineChart className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-white text-lg font-bold leading-none">TrendAI</h1>
                    <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Enterprise</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(13,204,242,0.05)]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm font-semibold">{item.label}</span>
                    </NavLink>
                ))}

                <div className="pt-10 pb-4">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Support</p>
                </div>

                {supportItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-6">
                <div className="bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-colors"></div>
                    <h3 className="text-sm font-bold text-white relative z-10">Upgrade to Pro</h3>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed relative z-10">Get advanced ML models and unlimited seats.</p>
                    <button className="w-full mt-4 bg-primary text-background-dark font-black text-[10px] py-2.5 rounded-lg hover:brightness-110 transition-all uppercase tracking-wider relative z-10">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
