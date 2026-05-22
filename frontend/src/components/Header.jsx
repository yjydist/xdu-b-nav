import { School, Cpu } from 'lucide-react';
import styles from './Header.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.iconBox}>
          <School size={20} className={styles.icon} />
        </div>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>B 楼导航系统</h1>
          <p className={styles.subtitle}>XDU · BUILDING B · ROUTE PLANNER</p>
        </div>
      </div>

      <div className={styles.spacer} />

      <span className={styles.statusPill} aria-label="服务运行中">
        <Cpu size={12} />
        <span>ONLINE</span>
      </span>
    </header>
  );
}

export default Header;
