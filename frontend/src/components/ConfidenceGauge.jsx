import styles from './ConfidenceGauge.module.css';

export default function ConfidenceGauge({ confidence, confidenceLevel, size = 180 }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  const getColor = () => {
    if (confidence >= 90) return '#22c55e';
    if (confidence >= 75) return '#3b82f6';
    if (confidence >= 50) return '#eab308';
    if (confidence >= 25) return '#f97316';
    return '#ef4444';
  };

  const getLabel = () => {
    if (confidenceLevel) return confidenceLevel;
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 50) return 'Moderate';
    return 'Low';
  };

  const color = getColor();

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 160 160">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className={styles.arc}
        />
      </svg>
      <div className={styles.content}>
        <strong className={styles.value} style={{ color }}>
          {confidence}%
        </strong>
        <span className={styles.label}>{getLabel()}</span>
      </div>
    </div>
  );
}
