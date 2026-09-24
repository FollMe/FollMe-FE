import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import PostCard from 'components/cards/PostCard';
import { formatLongDate } from 'util/date.js';
import { STORY_TYPE } from 'instants/story.instant';

export function getStoryLink(story) {
    if (story.type === STORY_TYPE.SERIES) {
        return `/stories/long-stories/${story.slug}`;
    }
    return `/stories/short-stories/${story.slug}`;
}

export default function StoryItem({ story, style }) {
    const isSeries = story.type === STORY_TYPE.SERIES;
    const numOfChaps = story.chaps?.length ?? 0;
    const badge = isSeries
        ? `Truyện dài${numOfChaps ? ` · ${numOfChaps} chương` : ''}`
        : 'Truyện ngắn';

    return (
        <PostCard
            to={getStoryLink(story)}
            state={isSeries ? { chaps: story.chaps, name: story.name } : undefined}
            image={story.picture?.link}
            badge={badge}
            title={story.name}
            author={story.author?.name ?? "Không xác định"}
            date={formatLongDate(story.updatedAt)}
            stats={[{
                icon: <IoChatbubbleEllipsesOutline />,
                label: story.numsOfCmt ?? "…",
                title: 'Bình luận'
            }]}
            style={style}
        />
    )
}
