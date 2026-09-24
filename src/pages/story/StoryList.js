import { useEffect, useState } from 'react';
import PageHeader from 'components/PageHeader';
import StoryItem from 'components/story/StoryItem';
import { PostCardSkeleton } from 'components/cards/PostCard';
import { request } from 'util/request';

export default function StoryList() {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    document.title = "Truyện | FollMe";
    getStory();

    async function getStory() {
      try {
        setIsLoading(true);
        const res = await request.get('api/stories');
        setIsLoading(false);
        const stories = res.stories;
        if (!Array.isArray(stories)) {
          return;
        }
        setStories(stories);
        populateNumsOfCmt(stories);
      } catch (err) {
        console.log(err);
      }
    }
  }, [])

  async function populateNumsOfCmt(stories) {
    const payload = {
      postSlugs: stories.map(story => story.slug)
    }
    const res = await request.post('comment-svc/api/comments/count', payload);
    const numsOfCmt = res?.numsOfCmt ?? {};

    setStories(current => {
      return current.map(story => {
        story.numsOfCmt = numsOfCmt[story.slug]
        return story
      })
    })
  }

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Truyện"
        title="Những câu chuyện"
        description="Truyện dài theo từng chương và những truyện ngắn — để đọc chậm, và cảm nhận nhiều hơn."
      />

      {
        isLoading ? (
          <div className="card-grid">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : stories.length <= 0 ? (
          <div className="empty-state">Hiện chưa có truyện nào.</div>
        ) : (
          <div className="card-grid stagger">
            {stories.map(story => <StoryItem key={story._id} story={story} />)}
          </div>
        )
      }
    </div>
  )
}
