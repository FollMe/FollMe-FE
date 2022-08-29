import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import Divider from '@mui/material/Divider';

import { formatDate } from 'util/date.js';

export default function StoryItem({ story }) {
    const name = story.name;
    const author = story.author.name ?? "Không xác định";
    const picture = story.picture?.link ?? "#";
    const updatedAt = formatDate(story.updatedAt);

    return (
        <Card>
            <CardActionArea>
                <CardMedia
                    component="img"
                    height="170"
                    image={picture}
                    alt="Story picture"
                    sx={{ aspectRatio: 16 / 9 }}
                    onError={e => {
                        e.target.src = "/imgs/default-story-background.webp";
                    }}
                />
                <Divider />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        {name}
                    </Typography>
                    <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5}}>
                        Tác giả: {author}
                    </Typography>
                    <Typography variant="body" color="text.secondary">
                        Ngày cập nhật: {updatedAt}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}