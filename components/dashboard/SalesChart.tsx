import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Product } from '../../types';

interface SalesChartProps {
    products: Product[];
}

const SalesChart: React.FC<SalesChartProps> = ({ products }) => {
    
    const generateWeeklyData = () => {
        const now = new Date();
        // Buckets are in reverse chronological order for easier processing
        const weeklyData = [
            { name: 'هذا الأسبوع', 'المسحات': 0, 'المبيعات': 0 },
            { name: 'الأسبوع الماضي', 'المسحات': 0, 'المبيعات': 0 },
            { name: 'قبل أسبوعين', 'المسحات': 0, 'المبيعات': 0 },
            { name: 'قبل 3 أسابيع', 'المسحات': 0, 'المبيعات': 0 },
        ];

        products.forEach(product => {
            // This logic groups the total performance of a product by its last activity date.
            // It provides insight into the performance of recently active vs. less recently active products.
            if (product.lastScanned) {
                const scanDate = new Date(product.lastScanned);
                const diffTime = now.getTime() - scanDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays <= 7) { // This week
                    weeklyData[0]['المسحات'] += product.scans;
                    weeklyData[0]['المبيعات'] += product.sales;
                } else if (diffDays <= 14) { // Last week
                    weeklyData[1]['المسحات'] += product.scans;
                    weeklyData[1]['المبيعات'] += product.sales;
                } else if (diffDays <= 21) { // 2 weeks ago
                    weeklyData[2]['المسحات'] += product.scans;
                    weeklyData[2]['المبيعات'] += product.sales;
                } else if (diffDays <= 28) { // 3 weeks ago
                    weeklyData[3]['المسحات'] += product.scans;
                    weeklyData[3]['المبيعات'] += product.sales;
                }
            }
        });

        // The recharts library expects data in chronological order for a proper line graph
        return weeklyData.reverse();
    };

    const chartData = generateWeeklyData();

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-96">
            <h3 className="text-lg font-semibold mb-4 text-white">المسحات مقابل المبيعات (آخر 4 أسابيع)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="name" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" />
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                    <Line type="monotone" dataKey="المسحات" stroke="#4299E1" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="المبيعات" stroke="#48BB78" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesChart;
