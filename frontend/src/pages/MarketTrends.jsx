import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ChevronRight, TrendingUp, TrendingDown, Globe, Zap, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch, exportAsCsv } from '../lib/api';
import { sentimentBreakdown } from '../lib/sentiment';

const MarketTrends = () => {
    const navigate = useNavigate();
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentiment, setSentiment] = useState({ positive: 0, negative: 0, neutral: 0, total: 0 });
    const [keywords, setKeywords] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/news');
            if (!res.ok) throw new Error('Failed to fetch news');
            const result = await res.json();
            const data = result.data || [];

            const breakdown = sentimentBreakdown(data);
            const pos = breakdown.Positive;
            const neg = breakdown.Negative;
            const neu = breakdown.Neutral;
            const total = breakdown.total;
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
        const rows = newsData.map((item) => ({
            keyword: item.keyword,
            title: item.title,
            sentiment: item.sentiment_label,
            date: item.published_date,
            source: item.link,
        }));
        exportAsCsv('market_trends_news.csv', rows);
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

            {/* Sentiment Analysis & Trending Keywords */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* News Sentiment Summary */}
                <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <h4 className="text-2xl font-bold mb-6">News Sentiment Summary</h4>
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Sentiment Stats */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Positive sentiment:</span>
                                    <span className="text-emerald-400 font-bold text-lg">{sentiment.positive}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Neutral sentiment:</span>
                                    <span className="text-slate-400 font-bold text-lg">{sentiment.neutral}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Negative sentiment:</span>
                                    <span className="text-rose-400 font-bold text-lg">{sentiment.negative}%</span>
                                </div>
                                <p className="text-xs text-slate-500 pt-3 border-t border-white/10">
                                    Based on {sentiment.total} news articles analyzed
                                </p>
                            </div>

                            {/* Recent Headlines */}
                            <div className="border-t border-white/10 pt-6">
                                <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recent Headlines</h5>
                                <div className="space-y-2 text-sm">
                                    {newsData.slice(0, 3).map((n, i) => (
                                        <div key={i} className="flex items-start gap-2 text-slate-300">
                                            <span className={`text-lg mr-1 ${n.sentiment_label === 'Positive' ? 'text-emerald-400' : n.sentiment_label === 'Negative' ? 'text-rose-400' : 'text-slate-400'}`}>•</span>
                                            <div className="flex-1">
                                                <p className="truncate">{n.title || 'News Article'}</p>
                                                <p className="text-xs text-slate-500">{n.sentiment_label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Trending Keywords */}
                <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <h4 className="text-2xl font-bold mb-6">Trending Keywords</h4>
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                    ) : keywords.length > 0 ? (
                        <div className="space-y-4">
                            {keywords.map((keyword, i) => (
                                <div key={keyword.rank} className="flex items-center gap-4">
                                    <div className="text-sm font-bold text-primary bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-12 text-center">
                                        {keyword.rank}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-white">{keyword.name}</p>
                                        <p className="text-xs text-slate-500">{keyword.growth} articles mentioned</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No trending keywords available.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MarketTrends;
