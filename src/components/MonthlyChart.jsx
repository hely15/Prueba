import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const MonthlyChart = ({ transactions }) => {
    const chartData = useMemo(() => {
        // Last 6 months
        const lastSixMonths = eachMonthOfInterval({
            start: startOfMonth(subMonths(new Date(), 5)),
            end: startOfMonth(new Date())
        });

        return lastSixMonths.map(month => {
            const monthStr = format(month, 'yyyy-MM');
            const monthLabel = format(month, 'MMM', { locale: es });

            const monthTransactions = transactions.filter(t =>
                format(parseISO(t.date), 'yyyy-MM') === monthStr
            );

            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                income,
                expense
            };
        });
    }, [transactions]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-white font-bold mb-1">{label}</p>
                    <p className="text-green-400 text-sm">
                        Ingresos: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[0].value)}
                    </p>
                    <p className="text-red-400 text-sm">
                        Gastos: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[1].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar
                        dataKey="income"
                        fill="var(--accent-purple)"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                    <Bar
                        dataKey="expense"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyChart;
