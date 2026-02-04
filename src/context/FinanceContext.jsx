import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../lib/utils';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('finance-app-transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem('finance-app-goals');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('finance-app-transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('finance-app-goals', JSON.stringify(goals));
    }, [goals]);

    const addTransaction = (transaction) => {
        setTransactions(prev => [{ id: generateId(), date: new Date().toISOString(), ...transaction }, ...prev]);
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const addGoal = (goal) => {
        setGoals(prev => [{ id: generateId(), currentAmount: 0, ...goal }, ...prev]);
    };

    const updateGoal = (id, amount) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    };

    const balance = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
    const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <FinanceContext.Provider value={{
            transactions,
            addTransaction,
            deleteTransaction,
            goals,
            addGoal,
            updateGoal,
            balance,
            income,
            expense
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
