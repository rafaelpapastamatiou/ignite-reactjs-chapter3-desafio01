import { ReactElement } from 'react';

import Link from 'next/link';

import styles from './styles.module.scss';

export const ExitPreviewButton = (): ReactElement => {
  return (
    <aside className={styles.container}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
};
