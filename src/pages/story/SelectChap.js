import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import styles from './SelectChap.module.scss';
import WumpusHiLoading from 'components/loading/WumpusHiLoading';
import { request } from 'util/request';

export default function SelectChap() {
    const location = useLocation();
    const { storySlug } = useParams();
    const [story, setStory] = useState(location.state);
    const [isLoading, setIsLoading] = useState(!location.state);

    useEffect(() => {
        if (!story) {
           getStory();
        } else {
            document.title = `${story.name} | FollMe`;
        }

        async function getStory() {
            try {
                const data = await request.get(`api/stories/${storySlug}`);
                if (!data.story) {
                    return;
                }
                document.title = `${data.story.name} | FollMe`;
                setStory(data.story);
                setIsLoading(false);
            } catch (err) {
                console.log(err.message);
            }    
        }
    }, [storySlug])
    return (
        <>
            <div className="container-view grid mobilePage">
                {
                    isLoading ? <WumpusHiLoading /> : (
                        <div className={styles.body}>
                            <h4 className={styles.pageType}>TRUYỆN</h4>
                            <h3>{story.name}</h3>
                            <div>
                                <Paper variant="outlined" sx={{ borderRadius: '8px', padding: '16px' }}>
                                <span className={styles.listOfChaps}>Danh sách chap</span>
                                <ul className={styles.selectChap}>
                                    {
                                        story.chaps.map(chap =>
                                            <Link to={chap.slug} key={chap._id} >
                                                <li className={styles.chapNumber}> {chap.name} </li>
                                            </Link>
                                        )
                                    }
                                </ul>
                                </Paper>
                            </div>
                        </div>
                    )
                }
            </div>
        </>
    )
}