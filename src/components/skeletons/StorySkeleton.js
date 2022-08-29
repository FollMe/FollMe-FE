import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';

export default function StorySkeleton() {

    return (
        <Card>
            <CardActionArea>
                <Skeleton variant="rectangular" height={170} sx={{ aspectRatio: 16 / 9 }} />
                <Divider />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        <Skeleton />
                    </Typography>
                    <Typography variant="body" color="text.secondary" component="div" sx={{ paddingBottom: 0.5 }}>
                        <Skeleton width="40%" />
                    </Typography>
                    <Typography variant="body" color="text.secondary">
                        <Skeleton width="60%" />
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}