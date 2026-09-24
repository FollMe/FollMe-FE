import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import clsx from 'clsx';
import { IoArrowBack, IoArrowForward, IoGridOutline, IoTimeOutline, IoBookOutline } from 'react-icons/io5';
import { request } from 'util/request';
import { getReadingMinutes } from 'util/date.js';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import { CommentContainer } from 'components/comment/CommentContainer';
import { useWebSocket } from "customHooks/useWebSocket";

import styles from "./Story.module.scss";

export default function Story() {
  const {wsSend} = useWebSocket();
  const { storySlug, chapSlug } = useParams();
  const [story, setStory] = useState({});
  const [nextChap, setNextChap] = useState({});
  const [previousChap, setPreviousChap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStory();

    async function getStory() {
      setIsLoading(true);
      try {
        const data = await request.get(`api/stories/${storySlug}/${chapSlug}`);
        if (!data.story || data.story.chaps.length <= 0) {
          return;
        }
        document.title = `${data.story.name} - ${data.story.chaps[0].name} | FollMe`;
        setStory(data.story);
        setPreviousChap(data.previousChap);
        setNextChap(data.nextChap);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    }

  }, [storySlug, chapSlug])

  useEffect(() => {
    subscribePost();

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
  }, [wsSend, storySlug])

  if (isLoading) {
    return <OvalLoading />
  }

  const chap = story.chaps[0];

  return (
    <article>
      <ReadingProgress />
      <div className="container container--narrow">
        <ArticleHeader
          back={{ to: `/stories/long-stories/${story.slug}`, label: story.name }}
          eyebrow="Truyện dài"
          title={chap.name}
          author={story.author?.name}
          meta={[
            <><IoBookOutline /> {story.name}</>,
            <><IoTimeOutline /> {getReadingMinutes(chap.content)} phút đọc</>,
          ]}
        />

        <div className={clsx('prose', styles.content)}>
          {chap.content}
        </div>

        <div className={styles.end}>
          <span>Hết {chap.name}</span>
        </div>

        <nav className={styles.chapNav} aria-label="Điều hướng chương">
          <Link
            to={`/stories/long-stories/${story.slug}/${previousChap?.slug}`}
            className={clsx(styles.chapLink, !previousChap && styles.disabled)}
            aria-disabled={!previousChap}
          >
            <span className={styles.chapLabel}><IoArrowBack /> Chương trước</span>
            <span className={styles.chapName}>{previousChap?.name ?? 'Không có'}</span>
          </Link>
          <Link to={`/stories/long-stories/${story.slug}`} className={styles.chapList} aria-label="Danh sách chương">
            <IoGridOutline />
          </Link>
          <Link
            to={`/stories/long-stories/${story.slug}/${nextChap?.slug}`}
            className={clsx(styles.chapLink, styles.next, !nextChap && styles.disabled)}
            aria-disabled={!nextChap}
          >
            <span className={styles.chapLabel}>Chương tiếp <IoArrowForward /></span>
            <span className={styles.chapName}>{nextChap?.name ?? 'Không có'}</span>
          </Link>
        </nav>

        <CommentContainer storySlug={storySlug} writerId={story.author._id} />
      </div>
    </article>
  )
}
