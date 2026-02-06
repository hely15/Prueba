import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, TrendingDown, Plus, X, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIES = {
    expense: ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Servicios', 'Otros'],
    income: ['Salario', 'Ventas', 'Regalo', 'Inversiones', 'Otros']
};

const Transactions = () => {
    const { transactions, addTransaction, deleteTransaction } = useFinance();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showAddForm, setShowAddForm] = useState(false);
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES.expense[0]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'add-expense') {
            setType('expense');
            setCategory(CATEGORIES.expense[0]);
            setShowAddForm(true);
            setSearchParams({}, { replace: true });
        } else if (action === 'add-income') {
            setType('income');
            setCategory(CATEGORIES.income[0]);
            setShowAddForm(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount) return;

        addTransaction({
            amount: parseFloat(amount),
            type,
            category,
            description: description || category,
        });

        setAmount('');
        setDescription('');
        setShowAddForm(false);
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        setCategory(CATEGORIES[newType][0]);
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="relative min-h-[80vh] animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Movimientos</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-10 h-10 rounded-full bg-[color:var(--accent-purple)] flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.5)] hover:bg-purple-600 transition-colors"
                >
                    <Plus size={24} color="white" />
                </button>
            </header>

            {/* Transactions List */}
            <div className="space-y-4 pb-20">
                {transactions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No hay registros aún.</p>
                        <p className="text-sm mt-2">Toca el + para agregar uno.</p>
                    </div>
                ) : (
                    transactions.map((t) => (
                        <div key={t.id} className="glass-panel p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">
                            <div className="flex items-center gap-4 z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{t.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>{t.category}</span>
                                        <span>•</span>
                                        <span>{format(new Date(t.date), "d 'de' MMM", { locale: es })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right z-10">
                                <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                </p>
                                <button
                                    onClick={() => deleteTransaction(t.id)}
                                    className="text-red-500/50 hover:text-red-500 text-xs mt-1 absolute right-[-100px] group-hover:relative group-hover:right-0 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Transaction Overlay (Glass Sheet) */}
            {showAddForm && createPortal(
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="w-full max-w-md bg-[#160d2b] border border-white/10 rounded-3xl p-6 pb-24 sm:pb-6 relative shadow-2xl safe-area-bottom overflow-y-auto max-h-[85vh]">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6">Nuevo Movimiento</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Type Toggle */}
                            <div className="flex p-1 bg-white/5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('expense')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Gasto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('income')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'income' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Ingreso
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Monto</label>
                                <input
                                    type="number"
                                    className="input-field text-2xl font-bold"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Categoría</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES[type].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${category === cat ? 'bg-white/20 border-white/40 text-white' : 'border-white/10 text-gray-400'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Descripción (Opcional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="¿En qué gastaste?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full mt-4">
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Transactions;
