import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';
import { IoTimeOutline, IoCalendarOutline } from 'react-icons/io5';
import styles from "./Story.module.scss";
import { request } from 'util/request';
import { formatLongDate, getReadingMinutes } from 'util/date.js';
import { CommentContainer } from 'components/comment/CommentContainer';
import { useWebSocket } from "customHooks/useWebSocket";
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';

export default function ShortStory() {
  const {wsSend} = useWebSocket();
  const { storySlug } = useParams();

  const [story, setStory] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStory();

    async function getStory() {
      try {
        setIsLoading(true);
        const data = await request.get(`api/short-stories/${storySlug}`);
        if (!data.story || data.story.chaps.length !== 1) {
          return;
        }
        document.title = `${data.story.name} | FollMe`;
        setStory(data.story);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    }
  }, [storySlug])

  useEffect(() => {
    subscribePost()

    async function subscribePost() {
      try {
        wsSend({
          action: 'join_post',
          message: storySlug
        })
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      wsSend({
        action: 'join_post',
        message: ""
      })
    }
  }, [storySlug, wsSend])

  if (isLoading) {
    return <OvalLoading />
  }

  return (
    <article>
      <ReadingProgress />
      <div className="container container--narrow">
        <ArticleHeader
          back={{ to: '/stories', label: 'Tất cả truyện' }}
          eyebrow="Truyện ngắn"
          title={story.name}
          author={story.author?.name}
          meta={[
            story.updatedAt && <><IoCalendarOutline /> {formatLongDate(story.updatedAt)}</>,
            <><IoTimeOutline /> {getReadingMinutes(story.chaps[0].content)} phút đọc</>,
          ]}
        />

        <div className={clsx('prose', styles.content)}>
          {story.chaps[0].content}
        </div>

        <div className={styles.end}>
          <span>Hết</span>
        </div>

        <CommentContainer storySlug={storySlug} writerId={story.author._id} />
      </div>
    </article>
  )
}
