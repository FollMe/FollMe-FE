import { IoEyeOutline } from "react-icons/io5";
import PostCard from 'components/cards/PostCard';
import { formatLongDate } from 'util/date.js';

export default function BlogItem({ blog, variant, style }) {
  const author = blog.author?.name ?? blog.author?.slEmail ?? "Không xác định";

  return (
    <PostCard
      to={`/blogs/${blog.slug}`}
      image={blog.thumbnail?.link}
      badge={variant === 'featured' ? 'Bài viết mới nhất' : 'Blog'}
      title={blog.title}
      author={author}
      date={formatLongDate(blog.updatedAt)}
      stats={[{ icon: <IoEyeOutline />, label: blog.viewed ?? 0, title: 'Lượt xem' }]}
      variant={variant}
      style={style}
    />
  )
}
