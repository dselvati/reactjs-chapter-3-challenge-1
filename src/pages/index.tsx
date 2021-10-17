import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import Prismic from '@prismicio/client'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Head from 'next/head';
import Link from 'next/link'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';

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
}

export default function Home({ postsPagination }: HomeProps) {

  const [posts, setPosts] = useState<Post[]>(postsPagination.results)
  const [nextPage, setNextPage] = useState<String>(postsPagination.next_page)

  async function handleClickLoadMorePosts() {
    //console.log('handleClickLoadMorePosts')
    try {
      const res = await fetch(`${nextPage}`)
      const data = await res.json()

      const { results, next_page } = data

      const newPosts = results.map(({ uid, data: { title, subtitle, author }, first_publication_date }) => (
        {
          uid,
          first_publication_date,
          data: {
            title,
            subtitle,
            author
          }
        }
      ))

      const postsToUpdate = [...posts]
      setPosts(postsToUpdate.concat(newPosts))
      setNextPage(next_page)
    } catch (err) {
      console.error(err && err.message)
      alert(err && err.message)
    }

  }

  return (
    <>
      <Head>
        <title>Posts | Início</title>
      </Head>
      <main className={styles.contentContainer}>
        <div className={styles.posts}>
          {
            posts.map(({ uid, first_publication_date, data: post }) => (
              <Link href={`/post/${uid}`} key={uid}>
                <a >
                  <h1 className={styles.title}>{post.title}</h1>
                  <p className={styles.subtitle}>{post.subtitle}</p>

                  <div>
                    <div>
                      {/* <img src="/images/calendar.svg" alt="Autor" /> */}
                      <FiCalendar size={28} />
                      <time>{

                        format(new Date(first_publication_date), 'dd MMM yyyy', {
                          locale: ptBR
                        })

                      }</time>
                    </div>
                    <div>
                      {/* <img src="/images/user.svg" alt="Autor" /> */}
                      <FiUser size={28} />
                      <span>{post.author}</span>
                    </div>
                  </div>
                </a>
              </Link>
            ))
          }

          {
            nextPage
            &&
            <div>
              <button type="button" onClick={handleClickLoadMorePosts}>Carregar mais posts</button>
            </div>
          }
        </div>


      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    //fetch: ['posts.title', 'posts.content'],
    //orderings: ['my.posts.first_publication_date desc'],
    pageSize: 1
  });

  //console.log(postsResponse)

  const { next_page } = postsResponse
  const results = postsResponse.results.map(post => {
    const { data: { title, subtitle, author }, uid, first_publication_date, last_publication_date } = post
    // console.log(data)
    return {
      uid,
      first_publication_date,
      data: {
        title: title,
        subtitle: subtitle,
        author: author,
      }
    }
  })

  const postsPagination = {
    next_page,
    results
  }

  return {
    props: { postsPagination }
  }
};
