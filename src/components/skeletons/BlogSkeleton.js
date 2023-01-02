import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import styles from "pages/story/StoryList.module.scss";

export default function BlogSkeleton() {

    return (
        <Grid container columnSpacing={2} rowSpacing={2}>
            <Grid item md={4} sm={12} xs={12}>
                <Skeleton variant="rectangular" height="170px" sx={{ borderRadius: '8px' }} />
            </Grid>
            <Grid item md={8} sm={12} xs={12}>
                <div className={styles.storyContentContainer}>
                    <Typography gutterBottom variant="h4" component="div"
                        sx={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color-title)', mb: '12px' }}
                    >
                        <Skeleton />
                    </Typography>
                    <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5 }}>
                        <Skeleton width="40%" />
                    </Typography>
                    <Typography variant="body" color="text.secondary">
                        <Skeleton width="60%" />
                    </Typography>
                </div>
            </Grid>
        </Grid>
    )
}