import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client'
import { useEffect, useState } from 'react';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps) {
  // TODO

  const [estimatedTime, setEstimatedTime] = useState<String>('')

  useEffect(() => {
    const totalWords = post?.data?.content?.reduce((acc, transaction) => {
      const { body } = transaction
      const words = RichText.asText(body).split(' ')
      //console.log(words.length)

      return acc + words.length
    }, 0)

    //console.log(totalWords)

    if (totalWords) {
      const estimatedTimeToUpdate = String(Math.ceil((totalWords / 200)))
      //console.log(estimatedTimeToUpdate)
      setEstimatedTime(estimatedTimeToUpdate)
    }


  }, [post])

  return (
    <>

      <div className={!post ? styles.loadingMessage : `${styles.loadingMessage} ${styles.hidden}`}>{'Carregando...'}</div>

      {
        post
        &&
        <>
          <div className={styles.imageContainer}>
            <img src={post.data.banner.url} />
          </div>

          <div className={styles.post}>

            <div className={commonStyles.contentContainer}>
              <h1>{post.data.title}</h1>

              <div className={styles.boxIcons}>
                <div>
                  {/* <img src="/images/calendar.svg" alt="Autor" /> */}
                  <FiCalendar size={28} />
                  <time>{
                    format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                      locale: ptBR
                    })
                  }</time>
                </div>
                <div>
                  {/* <img src="/images/user.svg" alt="Autor" /> */}
                  <FiUser size={28} />
                  <span>{post.data.author}</span>
                </div>
                <div>
                  {/* <img src="/images/clock.svg" alt="Autor" /> */}
                  <FiClock size={28} />
                  <span>{estimatedTime} min</span>
                </div>
              </div>

              <div>
                {
                  post.data.content.map(c => (
                    <div key={c.heading} className={styles.content}>
                      <h2>{c.heading}</h2>
                      {
                        c.body.map(b => (
                          <div key={b.text}
                            className={styles.bodyContent}
                            dangerouslySetInnerHTML={{ __html: b.text }}
                          />
                        ))
                      }
                    </div>
                  ))
                }

              </div>
            </div>
          </div>
        </>
      }


    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    //fetch: ['posts.title', 'posts.content'],
    //orderings: ['my.posts.first_publication_date desc'],
    pageSize: 1
  });

  const paths = postsResponse.results.map(({ uid }) => (
    {
      params: {
        slug: uid
      }
    }
  ))

  return {
    paths,
    fallback: true
  }

  // TODO
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  // TODO
  //console.log(response)
  const { uid, data, first_publication_date } = response
  const post = {
    uid,
    first_publication_date,
    data
  }

  return {
    props: {
      post
    },

    redirect: 60 * 30
  }
};
