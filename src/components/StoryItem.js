import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import Divider from '@mui/material/Divider';

export default function StoryItem({ name, author }) {
    return (
        <Card>
            <CardActionArea>
                <CardMedia
                    component="img"
                    height="170"
                    image="/imgs/microservice.jpeg"
                    alt="green iguana"
                    sx={{ aspectRatio: 16 / 9 }}
                />
                <Divider />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        Yêu nhầm chị hai được nhầm em gái
                    </Typography>
                    <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5}}>
                        Tác giả:    Leo Aslan
                    </Typography>
                    <Typography variant="body" color="text.secondary">
                        Ngày cập nhật: 17-07-2022
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}