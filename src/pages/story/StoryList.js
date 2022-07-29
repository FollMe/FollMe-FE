import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import StoryItem from 'components/StoryItem';

export default function StoryList() {
    useEffect(() => {
        document.title = "Truyện | FollMe";
    }, [])
    return (
        <div className="containerMain">
            <div className="containerStory">
                <Typography gutterBottom variant="h4" component="div" sx={{ paddingLeft: 2 }}>
                    DANH SÁCH TRUYỆN:
                </Typography>

                <Grid container columnSpacing={2} rowSpacing={4} sx={{ padding: 2 }} style={{ display: "flex", justifyItems: "center", alignContent: "center", alignItems: "center", direction: "row" }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <StoryItem />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <StoryItem />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <StoryItem />
                    </Grid>
                </Grid>

            </div>
        </div>
    )
}