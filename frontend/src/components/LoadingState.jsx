import styles from './LoadingState.module.css';

function LoadingState({ title, subtitle }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.spinner} />
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

export default LoadingState;
