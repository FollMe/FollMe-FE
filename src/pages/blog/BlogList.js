import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import styles from "./BlogList.module.scss";

export default function BlogList() {
    return (
        <div className="containerMain">
            <div className="containerStory">
                <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    Blogs
                </Typography>

                <Paper variant="outlined" sx={{ borderRadius: '8px', padding: '16px' }}>
                    There is no blog
                </ Paper>
            </div>
        </div>
    )
}