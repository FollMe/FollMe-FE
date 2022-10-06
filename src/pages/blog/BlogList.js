import { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import Paper from '@mui/material/Paper';
import styles from "./BlogList.module.scss";

export default function BlogList() {
    useEffect(() => {
        document.title = "Blog | FollMe";
    }, [])

    return (
        <div className="containerMain">
            <div className="containerStory">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        Blogs
                    </Typography>
                    <Tooltip placement='left' title={<Typography fontSize={"1.3rem"}>Write new blog</Typography>}>
                        <IconButton className={styles.btnAddNewBlog} variant="outlined">
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Paper variant="outlined" sx={{ marginTop: '20px', borderRadius: '8px', padding: '16px' }}>
                    There is no blog
                </ Paper>
            </div>
        </div>
    )
}