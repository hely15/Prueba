import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const Dashboard = () => {
    const { balance, income, expense, transactions } = useFinance();
    const user = JSON.parse(localStorage.getItem('user'));

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">Hola, {user?.name || 'Usuario'}</h1>
                    <p className="text-sm text-gray-400">Resumen Financiero</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-lg">💰</span>
                </div>
            </header>

            {/* Main Balance Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[color:var(--accent-purple)]/20 blur-[50px] rounded-full -mt-10 -mr-10"></div>
                <p className="text-gray-400 font-medium mb-1 z-10 relative">Balance Total</p>
                <h2 className="text-4xl font-bold text-white mb-4 z-10 relative neon-text tracking-tight">
                    {formatMoney(balance)}
                </h2>

                <div className="flex gap-4 mt-6">
                    <div className="flex-1 bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Ingresos</p>
                            <p className="text-sm font-semibold text-green-400">{formatMoney(income)}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                            <TrendingDown size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gastos</p>
                            <p className="text-sm font-semibold text-red-400">{formatMoney(expense)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="mt-8">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-semibold text-white/90">Recientes</h3>
                    <button className="text-xs text-[color:var(--accent-purple)] hover:text-white transition-colors">Ver todo</button>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="glass-panel rounded-xl p-8 text-center text-gray-500">
                            <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No hay movimientos aún</p>
                        </div>
                    ) : (
                        transactions.slice(0, 5).map((t) => (
                            <div key={t.id} className="glass-panel p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{t.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
