import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from './ProbabilityChart.module.css';

const ALL_DISEASES = [
  'Breast Cancer',
  'Lung Cancer',
  "Alzheimer's Disease",
  "Parkinson's Disease",
  'Leukemia',
  'Type 2 Diabetes',
  'Ovarian Cancer',
  'Colorectal Cancer',
];

const CHART_PALETTE = ['#3A6FD8', '#4DA8A3', '#67A96B', '#D8A248', '#7B8DBD', '#B5C0CD'];

export default function ProbabilityChart({ predictions = [], topDisease = '' }) {
  const chartData = useMemo(() => {
    const predMap = {};
    predictions.forEach((item) => {
      predMap[item.disease] = item.probability;
    });

    return ALL_DISEASES.map((dis) => {
      const prob = predMap[dis] !== undefined ? predMap[dis] : 0.5;
      return {
        disease: dis,
        probability: Number(prob.toFixed(2)),
        isTop: dis === topDisease,
      };
    }).sort((a, b) => b.probability - a.probability);
  }, [predictions, topDisease]);

  return (
    <div className={styles.container}>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
            <XAxis
              dataKey="disease"
              angle={-25}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11, fill: '#718096' }}
            />
            <YAxis
              unit="%"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#718096' }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Probability']}
              contentStyle={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(35,49,69,0.06)' }}
            />
            <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.disease}
                  fill={entry.isTop ? '#3A6FD8' : CHART_PALETTE[(idx + 1) % CHART_PALETTE.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Disease Association</th>
              <th>Probability (%)</th>
              <th>Likelihood Status</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, idx) => (
              <tr key={item.disease} className={item.isTop ? styles.topRow : ''}>
                <td>
                  <span className={item.isTop ? styles.rankBadgeTop : styles.rankBadge}>
                    #{idx + 1}
                  </span>
                </td>
                <td className={styles.diseaseName}>
                  <strong>{item.disease}</strong>
                  {item.isTop && <span className={styles.topTag}>Highest Risk Association</span>}
                </td>
                <td className={styles.probVal}>
                  <strong>{item.probability.toFixed(2)}%</strong>
                </td>
                <td>
                  <div className={styles.barMini}>
                    <div
                      className={item.isTop ? styles.fillTop : styles.fillNormal}
                      style={{ width: `${Math.max(item.probability, 4)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
