import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Plus, Search, Filter, FileText, PieChart, BarChart2, ExternalLink, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Reports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, news: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        fetchReports(token);
    }, []);

    const fetchReports = async (token) => {
        try {
            setLoading(true);
            const [prodRes, newsRes] = await Promise.all([
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/news', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const prodData = prodRes.ok ? (await prodRes.json()).data || [] : [];
            const newsData = newsRes.ok ? (await newsRes.json()).data || [] : [];

            // Build category-level reports from product data
            const categoryMap = {};
            prodData.forEach(item => {
                const cat = item.category || 'General';
                if (!categoryMap[cat]) categoryMap[cat] = { pos: 0, neg: 0, neu: 0, total: 0 };
                categoryMap[cat].total++;
                if (item.sentiment_label === 'Positive') categoryMap[cat].pos++;
                else if (item.sentiment_label === 'Negative') categoryMap[cat].neg++;
                else categoryMap[cat].neu++;
            });

            const icons = [PieChart, BarChart2, FileText, ExternalLink];
            const colors = ['text-primary', 'text-emerald-400', 'text-amber-400', 'text-violet-400'];
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            const generated = Object.entries(categoryMap).map(([cat, d], i) => ({
                id: i + 1,
                title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Sentiment Report`,
                date: today,
                tags: [cat, d.pos >= d.neg ? 'Positive Trend' : 'Negative Trend'],
                icon: icons[i % icons.length],
                color: colors[i % colors.length],
                total: d.total,
                pos: d.pos,
                neg: d.neg,
                neu: d.neu,
                posP: d.total > 0 ? Math.round((d.pos / d.total) * 100) : 0,
                category: cat,
            }));

            // Add a news report if we have news data
            if (newsData.length > 0) {
                const nPos = newsData.filter(n => n.sentiment_label === 'Positive').length;
                const nNeg = newsData.filter(n => n.sentiment_label === 'Negative').length;
                const nNeu = newsData.filter(n => n.sentiment_label === 'Neutral').length;
                generated.push({
                    id: generated.length + 1,
                    title: 'News Sentiment Analysis',
                    date: today,
                    tags: ['News', nPos >= nNeg ? 'Positive' : 'Negative'],
                    icon: ExternalLink,
                    color: 'text-violet-400',
                    total: newsData.length,
                    pos: nPos,
                    neg: nNeg,
                    neu: nNeu,
                    posP: newsData.length > 0 ? Math.round((nPos / newsData.length) * 100) : 0,
                    category: 'news',
                });
            }

            setReports(generated);
            setStats({ total: prodData.length, news: newsData.length });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = async (category) => {
        const token = localStorage.getItem('token');
        const endpoint = category === 'news' ? '/api/news' : '/api/products';
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        const data = result.data || [];
        const filtered = category === 'news' ? data : data.filter(d => d.category === category);

        if (!filtered.length) return;
        const keys = Object.keys(filtered[0]);
        const csv = [keys.join(','), ...filtered.map(row =>
            keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')
        )].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${category}_report.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <DashboardLayout title="Reports">
            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-8">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-black text-white tracking-tight mb-3">Reports</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">Manage, export, and analyze your AI-generated sentiment reports.</p>
                    </div>
                    <button onClick={() => { const t = localStorage.getItem('token'); if (t) fetchReports(t); }}
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-background-dark font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20">
                        <Plus className="w-6 h-6" /> Refresh Reports
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                            className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                            placeholder="Search reports by name or tag..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl">
                            {['All', 'Products', 'News'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-background-dark' : 'text-slate-500 hover:text-white'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-primary/50 transition-all">
                            <Filter className="w-5 h-5 text-primary" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredReports
                            .filter(r => activeTab === 'All' || (activeTab === 'News' ? r.category === 'news' : r.category !== 'news'))
                            .map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="group bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] hover:border-primary/50 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`p-4 bg-white/5 rounded-2xl ${report.color}`}>
                                        <report.icon className="w-6 h-6" />
                                    </div>
                                    <button onClick={() => downloadCSV(report.category)}
                                        className="p-2 text-slate-500 hover:text-primary transition-colors" title="Download CSV">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                                <p className="text-xs text-slate-500 font-medium mb-4">Generated on {report.date} · {report.total} records</p>

                                {/* Sentiment mini-bars */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex gap-2 h-2">
                                        <div className="bg-emerald-400 rounded-full" style={{ width: `${report.posP}%` }}></div>
                                        <div className="bg-rose-400 rounded-full" style={{ width: `${report.total > 0 ? Math.round((report.neg / report.total) * 100) : 0}%` }}></div>
                                        <div className="bg-slate-500 rounded-full flex-1"></div>
                                    </div>
                                    <p className="text-xs text-slate-500">{report.posP}% positive · {report.total > 0 ? Math.round((report.neg / report.total) * 100) : 0}% negative</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {report.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 text-[10px] font-black rounded-lg uppercase tracking-wider text-slate-400">{tag}</span>
                                    ))}
                                </div>
                                <button onClick={() => downloadCSV(report.category)}
                                    className="w-full py-3 bg-white/5 border border-white/10 hover:bg-primary hover:text-background-dark font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all">
                                    Download CSV
                                </button>
                            </motion.div>
                        ))}

                        {/* New Analysis Card */}
                        <div onClick={() => navigate('/sentiment')}
                            className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-6 group hover:border-primary/50 transition-all cursor-pointer">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-white">New Sentiment Analysis</p>
                                <p className="text-sm text-slate-500 mt-1">Go to Sentiment page to analyze more data</p>
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Open Analysis →</span>
                        </div>
                    </div>
                )}

                {/* Footer Stats */}
                <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] flex flex-wrap items-center justify-between gap-10">
                    <div className="flex items-center gap-12">
                        {[
                            { label: 'Total Product Reviews', val: loading ? '...' : String(stats.total) },
                            { label: 'News Articles', val: loading ? '...' : String(stats.news) },
                            { label: 'Generated Reports', val: loading ? '...' : String(reports.length) },
                        ].map(stat => (
                            <div key={stat.label}>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                                <p className="text-3xl font-black">{stat.val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Batch Export</button>
                        <button className="px-8 py-4 bg-white text-background-dark rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Download All (ZIP)</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
