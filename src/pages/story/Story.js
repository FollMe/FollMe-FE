import AppsIcon from '@mui/icons-material/Apps';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from "./Story.module.scss";
import { request } from 'util/request';
import Paper from '@mui/material/Paper';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OvalLoading from 'components/OvalLoading';

export default function Story() {
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
                window.scrollTo(0, 0)
            } catch (err) {
                console.log(err);
            }
        }
    }, [storySlug, chapSlug])

    return (
        <>
            <div className="container-view grid">
                {
                    isLoading ? <OvalLoading /> :
                        <Paper variant="outlined" sx={{ borderRadius: '8px', paddingBottom: '30px', mb: '30px' }}>
                            <div className={styles.boxContent}>
                                <div className={styles.chapNumber}>
                                    <b><ArrowForwardIosIcon /> {story.name}</b>
                                </div>
                                <span>{story.chaps[0].name}</span>
                                <pre className={styles.content}>
                                    {story.chaps[0].content}
                                </pre>
                                <div className={styles.paginateChap}>
                                    <span>Hết: {story.chaps[0].name}</span>
                                    <div className={styles.functionBar}>
                                        <Link
                                            to={`/stories/${story.slug}/${previousChap?.slug}`}
                                            className={(!previousChap && styles.btnDisabled) || ""}
                                        >
                                            <div className={styles.buttonChap}>
                                                <KeyboardArrowLeftIcon sx={{ fontSize: 24 }} />
                                                <span style={{ marginLeft: 5 }}> Trước </span>
                                            </div>
                                        </Link>
                                        <Link to={`/stories/${story.slug}`}>
                                            <div className={styles.buttonChap}>
                                                <AppsIcon sx={{ fontSize: 24 }} />
                                            </div>
                                        </Link>
                                        <Link
                                            to={`/stories/${story.slug}/${nextChap?.slug}`}
                                            className={(!nextChap && styles.btnDisabled) || ""}
                                        >
                                            <div className={styles.buttonChap}>
                                                <span style={{ marginRight: 5 }}> Tiếp &ensp; </span>
                                                <KeyboardArrowRightIcon sx={{ fontSize: 24 }} />
                                            </div>
                                        </Link>
                                    </ div>
                                </div>

                            </div>
                        </Paper>
                }
            </div>
        </>
    )
}