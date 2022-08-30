import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import styles from './SelectChap.module.scss';
import WumpusHiLoading from 'components/WumpusHiLoading';
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
                            <h4>Truyện: {story.name}</h4>
                            <div>
                                <ul className={styles.selectChap}>
                                    {
                                        story.chaps.map(chap =>
                                            <Link to={chap.slug} key={chap._id} >
                                                <li className={styles.chapNumber}> {chap.name} </li>
                                            </Link>
                                        )
                                    }
                                </ul>
                            </div>
                        </div>
                    )
                }
            </div>
            <footer className='grid'>
                <img src="/imgs/follme-logo.png" alt="follme-logo" className="follme-logo" />
                <h4>FollMe</h4>
            </footer>
        </>
    )
}