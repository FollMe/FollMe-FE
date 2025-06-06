import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from "./Story.module.scss";
import { request } from 'util/request';
import Paper from '@mui/material/Paper';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { CommentContainer } from 'components/comment/CommentContainer';
import { useWebSocket } from "customHooks/useWebSocket";
import OvalLoading from 'components/loading/OvalLoading';

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

  return (
    <>
      <div className="container-view grid">
        {
          isLoading ? <OvalLoading /> :
            <>
              <Paper variant="outlined" sx={{ borderRadius: '8px', paddingBottom: '30px', mb: '30px' }}>
                <div className={styles.boxContent}>
                  <div className={styles.chapNumber}>
                    <b><ArrowForwardIosIcon /> {story.name}</b>
                  </div>
                  <pre className={styles.content}>
                    {story.chaps[0].content}
                  </pre>
                  <div className={styles.paginateChap}>
                    <span>-- Hết --</span>
                  </div>
                </div>
              </Paper>
              <CommentContainer storySlug={storySlug} writerId={story.author._id} />
            </>
        }
      </div>
    </>
  )
}