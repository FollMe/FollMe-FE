import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from "./Story.module.scss";
import { request } from 'util/request';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OvalLoading from 'components/OvalLoading';

export default function ShortStory() {
    const { storySlug } = useParams();
  
    const [story, setStory] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getStory();

        async function getStory() {
            setIsLoading(true);
            const data = await request.get(`api/short-stories/${storySlug}`);
            if (!data.story || data.story.chaps.length !== 1) {
                return;
            }
            document.title = `${data.story.name} | FollMe`;
            setStory(data.story);
            setIsLoading(false);
        }
    }, [storySlug])

    return (
        <>
            <div className="container-view grid">
                {
                    isLoading ? <OvalLoading /> :
                        <>
                            <div className={styles.boxContent}>
                                <div className={styles.chapNumber}>
                                    <b><ArrowForwardIosIcon /> {story.name}</b>
                                </div>
                                <pre className={styles.content}>
                                    {story.chaps[0].content}
                                </pre>
                                <div className={styles.paginateChap}>
                                    <span> -- Hết -- </span>
                                </div>

                            </div>
                        </>
                }
            </div>
            <footer className='grid'>
                <img src="/imgs/follme-logo.png" alt="follme-logo" className="follme-logo" />
                <h4>FollMe</h4>
            </footer>
        </>
    )
}