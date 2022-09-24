import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import StoryItem from 'components/StoryItem';
import { request } from 'util/request';
import StorySkeleton from 'components/skeletons/StorySkeleton';
import styles from "./StoryList.module.scss";

export default function StoryList() {
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        document.title = "Truyện | FollMe";
        getStory();

        async function getStory() {
            try{
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
                <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ paddingLeft: 2 }}>
                    Stories
                </Typography>
        
                <Grid container columnSpacing={2} rowSpacing={4} sx={{ padding: 2 }} style={{ display: "flex", justifyItems: "center", alignContent: "center", alignItems: "center", direction: "row" }}>
                    {
                        isLoading ? (
                            <>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StorySkeleton />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StorySkeleton />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StorySkeleton />
                                </Grid>
                            </>
                        ) : stories.map(story =>
                            <Grid key={story._id} item xs={12} sm={6} md={4}>
                                <StoryItem story={story}/>
                            </Grid>
                        )
                    }
                </Grid>

            </div>
        </div>
    )
}