import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import clsx from 'clsx';
import { IoArrowBack, IoArrowForward, IoGridOutline, IoTimeOutline, IoBookOutline } from 'react-icons/io5';
import { request } from 'util/request';
import { getReadingMinutes } from 'util/date.js';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import HeartButton from 'components/reaction/HeartButton';
import { storyPostKey } from 'util/reaction';
import BookmarkButton from 'components/reading/BookmarkButton';
import { recordRead } from 'util/readingList';
import { CommentContainer } from 'components/comment/CommentContainer';
import { useWebSocket } from "customHooks/useWebSocket";

import styles from "./Story.module.scss";

// A series is one entry that remembers the last chapter read.
function toReadingItem(story, storySlug, chapSlug) {
  return {
    key: storyPostKey(storySlug),
    type: 'story',
    title: story.name,
    to: `/stories/long-stories/${storySlug}/${chapSlug}`,
    image: story.picture?.link,
    subtitle: story.chaps?.[0]?.name,
  };
}

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
        recordRead(toReadingItem(data.story, storySlug, chapSlug));
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
          actions={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <HeartButton postKey={storyPostKey(storySlug)} />
              <BookmarkButton item={toReadingItem(story, storySlug, chapSlug)} />
            </div>
          }
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
