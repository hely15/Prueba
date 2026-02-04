import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus, X, Trophy } from 'lucide-react';

const Goals = () => {
    const { goals, addGoal, updateGoal } = useFinance();
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    // State for adding funds modal
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [amountToAdd, setAmountToAdd] = useState('');

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const handleCreateGoal = (e) => {
        e.preventDefault();
        addGoal({
            name,
            targetAmount: parseFloat(targetAmount),
        });
        setName('');
        setTargetAmount('');
        setShowAddForm(false);
    };

    const handleAddFunds = (e) => {
        e.preventDefault();
        if (selectedGoalId && amountToAdd) {
            updateGoal(selectedGoalId, parseFloat(amountToAdd));
            setSelectedGoalId(null);
            setAmountToAdd('');
        }
    };

    return (
        <div className="min-h-[80vh] animate-fade-in relative pb-20">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mis Metas</h1>
                    <p className="text-sm text-gray-400">Sueña en grande</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-10 h-10 rounded-full bg-[color:var(--accent-purple)] flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.5)] hover:bg-purple-600 transition-colors"
                >
                    <Plus size={24} color="white" />
                </button>
            </header>

            <div className="space-y-4">
                {goals.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Trophy size={48} className="mx-auto mb-4 opacity-50 text-yellow-500" />
                        <p>No tienes metas activas.</p>
                        <p className="text-sm mt-2">Crea una para empezar a ahorrar.</p>
                    </div>
                ) : (
                    goals.map(goal => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        return (
                            <div key={goal.id} className="glass-panel p-5 rounded-2xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                                            <Target size={20} />
                                        </div>
                                        <h3 className="text-white font-bold text-lg">{goal.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGoalId(goal.id)}
                                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white transition-colors"
                                    >
                                        + Abonar
                                    </button>
                                </div>

                                <div className="flex justify-between text-sm text-gray-400 mt-4 mb-1">
                                    <span>{formatMoney(goal.currentAmount)}</span>
                                    <span>{formatMoney(goal.targetAmount)}</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-1000 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs text-[color:var(--accent-purple)] mt-1 font-bold">{progress.toFixed(0)}%</p>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Goal Modal */}
            {showAddForm && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 pb-24 sm:pb-6 relative border border-white/20">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Nueva Meta</h2>
                        <form onSubmit={handleCreateGoal} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nombre de la meta</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: Viaje a Japón"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Monto Objetivo</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0"
                                    value={targetAmount}
                                    onChange={e => setTargetAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full mt-2">Crear Meta</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Funds Modal */}
            {selectedGoalId && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 pb-24 sm:pb-6 relative border border-white/20">
                        <button
                            onClick={() => setSelectedGoalId(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Abonar a la Meta</h2>
                        <form onSubmit={handleAddFunds} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Cantidad a abonar</label>
                                <input
                                    type="number"
                                    className="input-field text-2xl font-bold text-green-400"
                                    placeholder="0"
                                    value={amountToAdd}
                                    onChange={e => setAmountToAdd(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn-primary w-full mt-2">Abonar</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Goals;
