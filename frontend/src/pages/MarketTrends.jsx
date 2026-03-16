import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Plus, ChevronRight, TrendingUp, TrendingDown, Globe, Zap, Loader2, Newspaper, ArrowUpRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const MarketTrends = () => {
    const navigate = useNavigate();
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentiment, setSentiment] = useState({ positive: 0, negative: 0, neutral: 0, total: 0 });
    const [keywords, setKeywords] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        fetchNews(token);
    }, []);

    const fetchNews = async (token) => {
        try {
            setLoading(true);
            const res = await fetch('/api/news', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch news');
            const result = await res.json();
            const data = result.data || [];

            const pos = data.filter(n => n.sentiment_label === 'Positive').length;
            const neg = data.filter(n => n.sentiment_label === 'Negative').length;
            const neu = data.filter(n => n.sentiment_label === 'Neutral').length;
            const total = data.length;
            setSentiment({
                positive: total > 0 ? Math.round((pos / total) * 100) : 0,
                negative: total > 0 ? Math.round((neg / total) * 100) : 0,
                neutral: total > 0 ? Math.round((neu / total) * 100) : 0,
                total,
            });

            // Count keyword mentions
            const kwCount = {};
            data.forEach(n => {
                const kw = n.keyword || n.platform || 'other';
                kwCount[kw] = (kwCount[kw] || 0) + 1;
            });
            const sorted = Object.entries(kwCount)
                .sort((a, b) => b[1] - a[1])
                .map(([kw, count], idx) => ({
                    rank: String(idx + 1).padStart(2, '0'),
                    name: kw.charAt(0).toUpperCase() + kw.slice(1),
                    cat: 'News Keyword',
                    val: Math.min(Math.round((count / total) * 100 * 3), 100),
                    growth: count,
                }));
            setKeywords(sorted.slice(0, 5));
            setNewsData(data.slice(0, 10));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const token = localStorage.getItem('token');
        window.open('/api/news', '_blank');
    };

    const stats = [
        { label: 'Total News Articles', value: loading ? '...' : String(sentiment.total), trend: null, icon: Globe },
        { label: 'Positive News', value: loading ? '...' : `${sentiment.positive}%`, trend: sentiment.positive - 50, icon: Zap },
        { label: 'Negative News', value: loading ? '...' : `${sentiment.negative}%`, trend: -(sentiment.negative), icon: TrendingDown },
        { label: 'Neutral News', value: loading ? '...' : `${sentiment.neutral}%`, trend: null, status: 'Mixed', icon: TrendingUp },
    ];

    return (
        <DashboardLayout title="Market Trends Analysis">
            {/* Breadcrumbs & Header */}
            <div className="space-y-8">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white font-bold">Market Trends Analysis</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-black text-white tracking-tight mb-3">Market Trends Analysis</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Real-time news sentiment and keyword trend analysis across global markets.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] relative group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-xs font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                            <stat.icon className="w-5 h-5 text-primary opacity-50" />
                        </div>
                        <div className="flex items-end gap-3 relative z-10">
                            <h3 className="text-3xl font-black">{stat.value}</h3>
                            {stat.trend != null && (
                                <span className={`text-sm font-bold flex items-center mb-1 ${stat.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stat.trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                    {Math.abs(stat.trend)}%
                                </span>
                            )}
                            {stat.status && (
                                <span className="px-2 py-0.5 rounded bg-primary text-background-dark text-[10px] font-black uppercase mb-1">{stat.status}</span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Trending Keywords Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* News Sentiment Summary Chart */}
                <div className="xl:col-span-2 bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h4 className="text-2xl font-bold">News Sentiment Distribution</h4>
                            <p className="text-slate-500 font-medium">{loading ? 'Loading data...' : `Based on ${sentiment.total} news articles`}</p>
                        </div>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>Positive
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-widest">
                                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>Negative
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>Neutral
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {[
                                { label: 'Positive', pct: sentiment.positive, color: 'bg-emerald-400' },
                                { label: 'Neutral', pct: sentiment.neutral, color: 'bg-slate-400' },
                                { label: 'Negative', pct: sentiment.negative, color: 'bg-rose-400' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-300">{item.label}</span>
                                        <span className="text-sm font-black text-white">{item.pct}%</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.pct}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Recent News */}
                            <div className="mt-8 space-y-3">
                                <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recent Headlines</h5>
                                {newsData.slice(0, 4).map((n, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                                        <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.sentiment_label === 'Positive' ? 'bg-emerald-400' : n.sentiment_label === 'Negative' ? 'bg-rose-400' : 'bg-slate-400'}`}></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate">{n.title || 'News Article'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{n.keyword && `#${n.keyword}`} · {n.sentiment_label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Trending Keywords */}
                <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <h4 className="text-2xl font-bold mb-10">Trending Keywords</h4>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {keywords.length > 0 ? keywords.map((p) => (
                                <div key={p.rank} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-background-dark transition-all duration-500">
                                        {p.rank}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white group-hover:text-primary transition-colors">{p.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{p.growth} articles</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-16 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p.val}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className="h-full bg-primary rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-500 text-sm">No news data available yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MarketTrends;
