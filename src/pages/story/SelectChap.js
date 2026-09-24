import { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { IoArrowForward, IoListOutline } from 'react-icons/io5';
import OvalLoading from 'components/loading/OvalLoading';
import ArticleHeader from 'components/article/ArticleHeader';
import { request } from 'util/request';
import styles from './SelectChap.module.scss';

export default function SelectChap() {
    const navigate = useNavigate();
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

    if (isLoading) {
        return <OvalLoading />
    }

    const chaps = story.chaps ?? [];

    return (
        <div className="container container--narrow">
            <ArticleHeader
                back={{ to: '/stories', label: 'Tất cả truyện' }}
                eyebrow="Truyện dài"
                title={story.name}
                author={story.author?.name}
                meta={[<><IoListOutline /> {chaps.length} chương</>]}
                actions={chaps.length > 0 && (
                    <Button variant="contained" endIcon={<IoArrowForward />} onClick={() => navigate(chaps[0].slug)}>
                        Bắt đầu đọc
                    </Button>
                )}
            />

            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Danh sách chương</h2>
                <ol className={styles.list}>
                    {
                        chaps.map((chap, index) =>
                            <li key={chap._id}>
                                <Link to={chap.slug} className={styles.item}>
                                    <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                                    <span className={styles.name}>{chap.name}</span>
                                    <IoArrowForward className={styles.arrow} />
                                </Link>
                            </li>
                        )
                    }
                </ol>
            </section>
        </div>
    )
}
