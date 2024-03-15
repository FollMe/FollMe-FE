import { useNavigate } from 'react-router-dom';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { formatDate } from 'util/date.js';
import styles from './BlogItem.module.scss';

export default function BlogItem({ blog }) {
    const navigate = useNavigate();
    const title = blog.title;
    const author = blog.author?.name ?? blog.author?.slEmail ?? "Không xác định";
    const thumbnail = blog.thumbnail?.link ?? "#";
    const updatedAt = formatDate(blog.updatedAt);

    function handleClickItem() {
        navigate(`/blogs/${blog.slug}`);
        return;
    }

    return (
        <div>
            <Grid container columnSpacing={2} rowSpacing={2}>
                <Grid item md={4} sm={12} xs={12}>
                    <CardMedia
                        component="img"
                        height="170"
                        image={thumbnail}
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
                            {title}
                        </Typography>
                        <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5 }}>
                            Author: {author}
                        </Typography>
                        <Typography variant="body" color="text.secondary">
                            Updated at: {updatedAt}
                        </Typography>
                        <div className={styles.storyContent_btnFunction}>
                            <div className={styles.btnFunction_like}>
                                <IoChatbubbleEllipsesOutline/>
                                <span>0</span>
                            </div>
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    )
}
