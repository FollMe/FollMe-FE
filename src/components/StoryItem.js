import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import Divider from '@mui/material/Divider';

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
            navigate(`/stories/${story.slug}`, {
                state: { chaps: story.chaps, name: story.name } 
            })
            return;
        }

        if (story.type === STORY_TYPE.SHORT) {
            navigate(`/short-stories/${story.slug}`);
            return;
        }
    }

    return (
        <Card onClick={handleClickItem}>
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