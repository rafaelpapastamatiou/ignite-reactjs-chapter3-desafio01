import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { ExitPreviewButton } from '../components/ExitPreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): ReactElement {
  const { results, next_page } = postsPagination;

  const [nextPage, setNextPage] = useState<string>();

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setNextPage(next_page);
  }, [next_page]);

  useEffect(() => {
    setPosts(results);
  }, [results]);

  const loadMore = useCallback(() => {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);

        setPosts(state => [...state, ...data.results]);
      });
  }, [nextPage]);

  const postsParsed = useMemo(() => {
    return posts.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    }));
  }, [posts]);

  return (
    <>
      <Head>
        <title>Home | spacetravelling</title>
      </Head>
      <main className={commonStyles.container}>
        <header className={styles.header}>
          <img src="/logo.svg" alt="logo" />
        </header>
        <div className={styles.posts}>
          {postsParsed.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a key={post.uid}>
                <span>{post.data.title}</span>
                <span>{post.data.subtitle}</span>
                <div className={styles.postFooter}>
                  <div>
                    <FiCalendar />
                    <span>{post.first_publication_date}</span>
                  </div>
                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button type="button" className={styles.loadMore} onClick={loadMore}>
            Carregar mais posts
          </button>
        )}
        {preview && <ExitPreviewButton />}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      ref: previewData?.ref ?? null,
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
      pageSize: 1,
      orderings: '[my.post.first_publication_date]',
    }
  );

  return {
    props: {
      postsPagination: {
        results: postsResponse.results,
        next_page: postsResponse.next_page,
      },
      preview,
    },
  };
};
