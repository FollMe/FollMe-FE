import { useNavigate } from 'react-router-dom';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import styles from './StoryItem.module.scss';


import { formatDate } from 'util/date.js';
import { STORY_TYPE } from 'instants/story.instant';

export default function StoryItem({ story }) {
    const navigate = useNavigate();
    const name = story.name;
    const author = story.author?.name ?? "Không xác định";
    const picture = story.picture?.link ?? "#";
    const updatedAt = formatDate(story.updatedAt);

    function handleClickItem() {
        if (story.type === STORY_TYPE.SERIES) {
            navigate(`/stories/long-stories/${story.slug}`, {
                state: { chaps: story.chaps, name: story.name }
            })
            return;
        }

        if (story.type === STORY_TYPE.SHORT) {
            navigate(`/stories/short-stories/${story.slug}`);
            return;
        }
    }

    return (
        <div>
            <Grid container columnSpacing={2} rowSpacing={2}>
                <Grid item md={4} sm={12} xs={12}>
                    <CardMedia
                        component="img"
                        height="170"
                        image={picture}
                        alt="Story picture"
                        sx={{ aspectRatio: 16 / 9, borderRadius: '8px', cursor: 'pointer' }}
                        onError={e => {
                            e.target.src = "/imgs/default-story-background.webp";
                        }}
                        onClick={handleClickItem}
                    />
                </Grid>
                <Grid item md={8} sm={12} xs={12}>
                    <div className={styles.storyContentContainer}>
                        <Typography gutterBottom variant="h4" component="div"
                            className={styles.storyContent_title}
                            sx={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color-title)', mb: '12px'}}
                            onClick={handleClickItem}
                        >
                            {name}
                        </Typography>
                        <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5 }}>
                            Tác giả: {author}
                        </Typography>
                        <Typography variant="body" color="text.secondary">
                            Ngày cập nhật: {updatedAt}
                        </Typography>
                        <div className={styles.storyContent_btnFunction}>
                            <div className={styles.btnFunction_like}>
                                <IoChatbubbleEllipsesOutline/>
                                <span>{ story.numsOfCmt ?? "..." }</span>
                            </div>
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    )
}
