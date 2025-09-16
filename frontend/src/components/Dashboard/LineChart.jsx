import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-medium text-gray-900">{`Fecha: ${label}`}</p>
        <p className="text-blue-600">
          Cargas: <span className="font-semibold">{payload[0]?.value}</span>
        </p>
        <p className="text-green-600">
          Envíos: <span className="font-semibold">{payload[1]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const LineChartComponent = ({ data }) => {
  // Preparar datos para el gráfico
  const chartData = data.dates.map((date, index) => ({
    fecha: date,
    cargas: data.cargas[index] || 0,
    envios: data.envios[index] || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="fecha" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="cargas"
          stroke="#3b82f6"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Cargas"
        />
        <Line
          type="monotone"
          dataKey="envios"
          stroke="#10b981"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          name="Envíos"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;