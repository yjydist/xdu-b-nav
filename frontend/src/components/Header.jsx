import { School } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.iconBox}>
        <School size={24} className={styles.icon} />
      </div>
      <h1 className={styles.title}>B 楼导航系统</h1>
      <div className={styles.spacer} />
      <ThemeToggle />
    </header>
  );
}

export default Header;
