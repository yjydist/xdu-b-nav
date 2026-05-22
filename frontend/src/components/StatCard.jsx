import styles from './StatCard.module.css';

function StatCard({ icon, label, value }) {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}

export default StatCard;
