import styles from './Istatistik.module.css';

export default function MacGecmisi() {
  return (
    <div className={styles.page}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>Maç Geçmişi</h1>
        <p className={styles.status}>Yakında...</p>
      </div>
    </div>
  );
}
