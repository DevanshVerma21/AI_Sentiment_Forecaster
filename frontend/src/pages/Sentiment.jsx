import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, MessageSquare, LineChart, Smile, Frown, Meh, Globe, Zap, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Sentiment = () => {
    const [sentimentData, setSentimentData] = useState({ positive: 0, neutral: 0, negative: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [avgScore, setAvgScore] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // Fetch product reviews
            const response = await fetch('http://localhost:8000/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const result = await response.json();
            const data = result.data || [];
            
            // Calculate sentiment breakdown
            const positive = data.filter(item => item.sentiment_label === 'Positive').length;
            const negative = data.filter(item => item.sentiment_label === 'Negative').length;
            const neutral = data.filter(item => item.sentiment_label === 'Neutral').length;
            const total = data.length;
            
            setSentimentData({
                positive: total > 0 ? Math.round((positive / total) * 100) : 0,
                neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
                negative: total > 0 ? Math.round((negative / total) * 100) : 0,
                total
            });
            
            // Calculate average sentiment score (positive=100, neutral=50, negative=0)
            const score = total > 0 ? Math.round(((positive * 100 + neutral * 50) / total)) : 0;
            setAvgScore(score);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { 
            label: 'Total Mentions', 
            value: loading ? '...' : sentimentData.total, 
            trend: 12.5, 
            icon: MessageSquare 
        },
        { 
            label: 'Sentiment Score', 
            value: loading ? '...' : avgScore, 
            outOf: '/100', 
            trend: sentimentData.positive - sentimentData.negative, 
            icon: LineChart 
        },
        { 
            label: 'Positive Rate', 
            value: loading ? '...' : `${sentimentData.positive}%`, 
            trend: sentimentData.positive - 50, 
            icon: Smile 
        },
    ];

    return (
        <DashboardLayout title="Sentiment Analysis">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tight">Sentiment Analysis</h1>
                    <div className="flex items-center gap-3 text-slate-400">
                        <Zap className="w-5 h-5 text-primary" />
                        <p className="text-lg">
                            {loading ? 'Loading...' : sentimentData.total > 0 ? `Analyzing ${sentimentData.total} Reviews` : 'All Products'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">
                        <Calendar className="w-5 h-5 text-primary" /> Last 30 Days
                    </button>
                    <button className="flex items-center gap-3 px-6 py-3 bg-primary text-background-dark rounded-2xl text-sm font-black shadow-lg shadow-primary/20">
                        <Download className="w-5 h-5" /> Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative group overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-20 ${stat.trend > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <p className="text-xs font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                            <stat.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black mb-3">
                                {stat.value}{stat.outOf && <span className="text-xl text-slate-600 ml-1">{stat.outOf}</span>}
                            </h3>
                            <div className={`flex items-center gap-2 text-sm font-bold ${stat.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stat.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span>{stat.trend > 0 ? '+' : ''}{stat.trend}% vs last month</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Breakdown & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/[0.03] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl"
                >
                    <h2 className="text-2xl font-bold mb-10">Sentiment Breakdown</h2>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {[
                                { label: 'Positive', val: sentimentData.positive, color: 'bg-emerald-400', icon: Smile },
                                { label: 'Neutral', val: sentimentData.neutral, color: 'bg-slate-400', icon: Meh },
                                { label: 'Negative', val: sentimentData.negative, color: 'bg-rose-400', icon: Frown }
                            ].map((item) => (
                                <div key={item.label} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 ${item.color.replace('bg', 'text')}`} />
                                            <span className="text-sm font-bold text-slate-300">{item.label}</span>
                                        </div>
                                        <span className="text-xl font-black text-white">{item.val}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.val}%` }}
                                            transition={{ duration: 1.5 }}
                                            className={`${item.color} h-full rounded-full shadow-[0_0_15px_rgba(13,204,242,0.2)]`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white/[0.03] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
                >
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <h2 className="text-2xl font-bold">Global Sentiment Map</h2>
                        <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline">Full Analytics</button>
                    </div>
                    <div className="relative aspect-video bg-white/5 rounded-3xl flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all duration-700">
                        <Globe className="w-32 h-32 text-primary opacity-5 animate-[spin_20s_linear_infinite]" />
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB74HeNO7OBlK_wlaur4RWWr3MEgYkbAxnV-qM2LbjlRqadaI-L0ld5SuYp5trPBIXu_mqP0S-_60kS1KgK_pbe-OUF7ZzoNqc7YmdwdmXFP8dGp_rztk_smwnq3npGT3yEct_hU-FIG7lMlrx6boQRXajPCX9fNSbz5jo2oJuDf5vzNry32eSlNw9ZnLjbk8n7c0GkQRzbGizH85vhIO7KWxEI0BTw270eidvUo2IVtuKkCkHx2duDNTciir-HRzo7fEKftSenmFkr"
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-2000"
                            alt="Map"
                        />
                        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.8)]"></div>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default Sentiment;
