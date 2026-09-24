import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import { IoCalendarOutline, IoTimeOutline, IoEyeOutline, IoArrowForward } from 'react-icons/io5';
import { request } from 'util/request';
import { formatLongDate, getReadingMinutes } from 'util/date.js';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import ShareButton from 'components/ShareButton';
import Avatar from 'components/Avatar';

import styles from "./Blog.module.scss";

export default function Blog() {
    const navigate = useNavigate();
    const { blogSlug } = useParams();
    const [blog, setBlog] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getBlog();

        async function getBlog() {
            setIsLoading(true);
            try {
                const data = await request.get(`api/blogs/${blogSlug}`);
                if (!data.blog) {
                    navigate(`/blogs`);
                    return;
                }
                document.title = `${data.blog.title} | FollMe`;
                setBlog(data.blog);
            } catch (err) {
                console.log(err);
                navigate(`/blogs`);
            } finally {
                setIsLoading(false);
            }
        }
    }, [blogSlug, navigate])

    if (isLoading) {
        return (
            <div className="container container--narrow">
                <div className={styles.skeleton}>
                    <Skeleton width={160} height={24} />
                    <Skeleton height={60} />
                    <Skeleton height={60} width="70%" />
                    <Skeleton height={40} width="50%" sx={{ mt: 3 }} />
                    <Skeleton variant="rectangular" height={360} sx={{ mt: 4, borderRadius: '16px' }} />
                </div>
            </div>
        )
    }

    const author = blog.author?.name ?? blog.author?.slEmail;

    return (
        <article>
            <ReadingProgress />
            <div className="container container--narrow">
                <ArticleHeader
                    back={{ to: '/blogs', label: 'Tất cả bài viết' }}
                    eyebrow="Blog"
                    title={blog.title}
                    author={author}
                    meta={[
                        <><IoCalendarOutline /> {formatLongDate(blog.updatedAt)}</>,
                        <><IoTimeOutline /> {getReadingMinutes(blog.content)} phút đọc</>,
                        blog.viewed !== undefined && <><IoEyeOutline /> {blog.viewed} lượt xem</>,
                    ]}
                    actions={<ShareButton title={blog.title} />}
                />
            </div>

            {blog.thumbnail?.link && (
                <div className={`container ${styles.coverWrap}`}>
                    <img className={styles.cover} alt="" src={blog.thumbnail.link}
                        onError={e => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="container container--narrow">
                <div className={`prose ${styles.content}`}
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                <aside className={styles.authorCard}>
                    <Avatar name={author} size={56} />
                    <div>
                        <div className={styles.authorLabel}>Viết bởi</div>
                        <div className={styles.authorName}>{author}</div>
                        <p>Cảm ơn bạn đã đọc đến cuối! Nếu thấy hữu ích, hãy chia sẻ bài viết cho bạn bè nhé.</p>
                    </div>
                </aside>

                <div className={styles.more}>
                    <Link to="/blogs" className={styles.moreLink}>
                        <span>Tiếp tục đọc</span>
                        <strong>Khám phá các bài viết khác</strong>
                    </Link>
                    <Button variant="contained" endIcon={<IoArrowForward />} onClick={() => navigate('/blogs')}>
                        Xem blog
                    </Button>
                </div>
            </div>
        </article>
    )
}
