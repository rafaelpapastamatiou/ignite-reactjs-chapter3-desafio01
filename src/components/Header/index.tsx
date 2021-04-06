import { ReactElement } from 'react';

import Link from 'next/link';

import commonStyles from '../../styles/common.module.scss';

import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <div className={commonStyles.container}>
      <header className={styles.header}>
        <Link href="/">
          <img src="/logo.svg" alt="logo" />
        </Link>
      </header>
    </div>
  );
}
