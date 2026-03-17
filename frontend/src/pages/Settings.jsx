import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Bell, CreditCard, Camera, Mail } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch } from '../lib/api';

const Settings = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({ firstname: '', lastname: '', email: '' });
    const [form, setForm] = useState({ firstname: '', lastname: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [systemUpdates, setSystemUpdates] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        apiFetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    const mapped = {
                        firstname: data.firstname || '',
                        lastname: data.lastname || '',
                        email: data.email || '',
                    };
                    setProfile(mapped);
                    setForm(mapped);
                }
            })
            .catch(() => {});
    }, [navigate]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');
            const response = await apiFetch('/api/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to update profile');
            }

            const result = await response.json();
            const updated = result.user || form;
            setProfile(updated);
            setForm({
                firstname: updated.firstname || '',
                lastname: updated.lastname || '',
                email: updated.email || '',
            });
            setMessage('Profile updated successfully.');
        } catch (error) {
            setMessage(error.message || 'Unable to save profile right now.');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setForm({ ...profile });
        setMessage('Unsaved changes were discarded.');
    };
    return (
        <DashboardLayout title="Settings">
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-10">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Settings</h1>
                        <p className="text-slate-400 text-lg mt-2">Manage your account settings and preferences.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleDiscard} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">Discard</button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-primary text-background-dark rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
                {message && <p className="text-sm text-primary">{message}</p>}

                {/* Profile */}
                <section className="space-y-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <User className="w-6 h-6 text-primary" /> Public Profile
                    </h3>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-full border-4 border-white/10 overflow-hidden bg-white/5 relative">
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd8vHeNF4oVRstPoPkgpf7g6-aOhZ8SMB411KofDo9yK9no8QWwI2Tuyi4Lz2_G9X-DBMs4TWzyXMf0GAp_1uQo3ianeqXq8z10G7qqPFGisuDqn7JIMEzXxto3GDDbU6jnIknX1UMz59lfvk8YaqYYXXqkgiJZD1446QyrtqmgasZSUwLvvqKrODQxE0KTSnmRVa-95GQ8GfcxiDXFFZEtljaBsmG4AnPchgswpq8rejrQScFHQqzHlcmuLR7pFhvxPoB4roU7IiO"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        alt="Profile"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <button className="absolute bottom-2 right-2 p-3 bg-primary text-background-dark rounded-full shadow-xl border-4 border-background-dark">
                                    <Camera className="w-5 h-5 font-bold" />
                                </button>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                {[
                                    { label: 'First Name', val: profile.firstname || '' },
                                    { label: 'Last Name', val: profile.lastname || '' },
                                ].map(field => (
                                    <div key={field.label} className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{field.label}</label>
                                        <input
                                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none text-white transition-all"
                                            value={form[field.label === 'First Name' ? 'firstname' : 'lastname']}
                                            onChange={(e) => setForm((prev) => ({
                                                ...prev,
                                                [field.label === 'First Name' ? 'firstname' : 'lastname']: e.target.value,
                                            }))}
                                        />
                                    </div>
                                ))}
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className="w-full pl-16 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none text-white transition-all"
                                            value={form.email}
                                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="space-y-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Shield className="w-6 h-6 text-primary" /> Security
                    </h3>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] divide-y divide-white/5 overflow-hidden">
                        <div className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                            <div>
                                <p className="font-bold text-lg">Password</p>
                                <p className="text-slate-500 mt-1">Update your account password regularly.</p>
                            </div>
                            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Change Password</button>
                        </div>
                        <div className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-lg">Two-Factor Authentication (2FA)</p>
                                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                                <p className="text-slate-500 mt-1">Extra layer of security for your account via authenticator app.</p>
                            </div>
                            <button className="px-6 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all">Disable</button>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="space-y-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <Bell className="w-6 h-6 text-primary" /> Notifications
                    </h3>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 space-y-10">
                        {[
                            { label: 'Email Alerts', desc: 'Weekly trend summaries and account activity.', checked: emailAlerts, onToggle: () => setEmailAlerts((v) => !v) },
                            { label: 'System Updates', desc: 'Get notified about new features and scheduled maintenance.', checked: systemUpdates, onToggle: () => setSystemUpdates((v) => !v) }
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between group">
                                <div>
                                    <p className="font-bold text-lg group-hover:text-primary transition-colors">{item.label}</p>
                                    <p className="text-slate-500 mt-1">{item.desc}</p>
                                </div>
                                <button onClick={item.onToggle} className={`w-14 h-8 rounded-full relative transition-colors ${item.checked ? 'bg-primary' : 'bg-white/10'}`}>
                                    <motion.div
                                        animate={{ x: item.checked ? 28 : 4 }}
                                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Billing */}
                <section className="space-y-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-primary" /> Billing
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-[3rem] p-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Active Plan</p>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-4xl font-black text-white">Pro Business</h4>
                                    <p className="text-slate-400 mt-2 text-lg">$49.00 / billed monthly</p>
                                </div>
                                <button className="px-8 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all">Upgrade Plan</button>
                            </div>
                            <div className="mt-12 pt-10 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Payment Method</p>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg">Visa ending in 4242</p>
                                        <p className="text-sm text-slate-500">Expires 12/26</p>
                                    </div>
                                    <button className="text-sm font-black text-primary hover:underline uppercase tracking-widest">Edit</button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-8">Usage This Month</p>
                                <div className="space-y-8">
                                    {[
                                        { label: 'AI Generations', val: 84 },
                                        { label: 'Data Storage', val: 12 },
                                    ].map(stat => (
                                        <div key={stat.label}>
                                            <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                                                <span>{stat.label}</span>
                                                <span className="text-primary">{stat.val}%</span>
                                            </div>
                                            <div className="h-3 bg-background-dark rounded-full overflow-hidden p-[2px]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stat.val}%` }}
                                                    className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(13,204,242,0.3)]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-10 italic leading-relaxed">Need more capacity? Check our Enterprise plans specialized for large teams.</p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
