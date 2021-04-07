import { useMemo } from 'react';

import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { format, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import Link from 'next/link';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';
import { ExitPreviewButton } from '../../components/ExitPreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: Post;
  nextPost: Post;
  preview: boolean;
}

export default function Post({ post, prevPost, nextPost, preview }: PostProps) {
  const router = useRouter();

  const createdAt = useMemo(() => {
    return format(new Date(post.first_publication_date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }, [post.first_publication_date]);

  const updatedAt = useMemo(() => {
    return format(
      new Date(post.last_publication_date),
      `dd MMM yyyy', às 'HH:mm`,
      {
        locale: ptBR,
      }
    );
  }, [post.last_publication_date]);

  const estimatedReadTime = useMemo(() => {
    const numberOfWords = post.data.content.reduce((acc, next) => {
      return acc + RichText.asHtml(next.body).split(' ').length;
    }, 0);

    return Math.ceil(numberOfWords / 200);
  }, [post.data.content]);

  return router.isFallback ? (
    <main className={commonStyles.container}>
      <span>Carregando...</span>
    </main>
  ) : (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <header>
            <h1>{post.data.title}</h1>
            <div className={styles.postFooter}>
              <div>
                <FiCalendar />
                <span>{createdAt}</span>
              </div>
              <div>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
              <div>
                <FiClock />
                <span>{estimatedReadTime} min</span>
              </div>
            </div>
            {updatedAt && <span>* editado em {updatedAt}</span>}
          </header>
          {post.data.content.map(section => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </article>

        <div className={styles.divider} />

        <div className={styles.navigation}>
          {prevPost && (
            <div className={styles.prevPost}>
              <span>{prevPost.data.title}</span>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}
          {nextPost && (
            <div className={styles.nextPost}>
              <span>{nextPost.data.title}</span>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          )}
        </div>

        <Comments />
        {preview && <ExitPreviewButton />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 10,
    }
  );

  return {
    paths: posts.results.map(post => ({ params: { slug: post.uid } })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
      pageSize: 1,
      after: `${response.id}`,
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
      pageSize: 1,
      after: `${response.id}`,
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date]',
    }
  );

  const postPublicationDate = new Date(response.first_publication_date);

  const prevPostData =
    prevPostResponse.results.length > 0 ? prevPostResponse.results[0] : null;

  const nextPostData =
    nextPostResponse.results.length > 0 ? nextPostResponse.results[0] : null;

  const prevPost =
    prevPostData &&
    isBefore(new Date(prevPostData.first_publication_date), postPublicationDate)
      ? prevPostResponse.results[0]
      : null;

  const nextPost =
    nextPostData &&
    isAfter(new Date(nextPostData.first_publication_date), postPublicationDate)
      ? nextPostResponse.results[0]
      : null;

  return {
    props: {
      post: response,
      prevPost,
      nextPost,
      preview,
    },
  };
};
