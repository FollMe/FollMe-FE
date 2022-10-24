import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import StoryItem from 'components/StoryItem';
import { request } from 'util/request';
import StorySkeleton from 'components/skeletons/StorySkeleton';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import styles from "./StoryList.module.scss";

export default function StoryList() {
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        document.title = "Story | FollMe";
        getStory();

        async function getStory() {
            try {
                setIsLoading(true);
                const res = await request.get('api/stories');
                setIsLoading(false);
                const stories = res.stories;
                if (!Array.isArray(stories)) {
                    return;
                }
                setStories(stories);
            } catch (err) {
                console.log(err);
            }
        }
    }, [])
    return (
        <div className="containerMain">
            <div className="containerStory">
                <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    Stories
                </Typography>

                <Paper variant="outlined" sx={{ borderRadius: '8px', padding: '16px' }}>
                    {
                        isLoading ? (
                            <>
                                <StorySkeleton />
                                <Divider light sx={{ margin: '20px 0' }} />
                                <StorySkeleton />
                                <Divider light sx={{ margin: '20px 0' }} />
                                <StorySkeleton />
                            </>
                        ) : stories.map((story, index) =>
                            <div key={story._id}>
                                <StoryItem story={story} />
                                {
                                    index < stories.length - 1 ? <Divider light sx={{ margin: '20px 0' }} /> : ""
                                }
                            </div>
                        )
                    }
                </ Paper>
            </div>
        </div>
    )
}