import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import {
    IoCalendarOutline, IoTimeOutline, IoEyeOutline, IoArrowForward, IoEllipsisHorizontal,
    IoCreateOutline, IoTrashOutline,
} from 'react-icons/io5';
import { request } from 'util/request';
import { formatLongDate, getReadingMinutes } from 'util/date.js';
import { buildToc } from 'util/toc';
import { sanitizeArticle } from 'util/sanitize';
import { excerpt, setPageMeta } from 'util/meta';
import { blogPostKey } from 'util/reaction';
import { handleCheckLoggedIn } from 'util/authHelper';
import { useUserInfo } from 'customHooks/useUserInfo';
import { useWebSocket } from 'customHooks/useWebSocket';
import ArticleHeader from 'components/article/ArticleHeader';
import TableOfContents from 'components/article/TableOfContents';
import ReadingProgress from 'components/ReadingProgress';
import ShareButton from 'components/ShareButton';
import Avatar from 'components/Avatar';
import BlogItem from 'components/blog/BlogItem';
import HeartButton from 'components/reaction/HeartButton';
import BookmarkButton from 'components/reading/BookmarkButton';
import { recordRead } from 'util/readingList';
import { CommentContainer } from 'components/comment/CommentContainer';

import styles from "./Blog.module.scss";

// Below this many headings a table of contents is just noise.
const MIN_TOC_HEADINGS = 3;
const RELATED_COUNT = 3;

/**
 * Picks other posts to read next: the same author's first, then the newest.
 */
function pickRelated(blogs, current) {
    const authorId = current.author?._id;
    const others = blogs.filter(b => b.slug !== current.slug);
    const sameAuthor = others.filter(b => authorId && b.author?._id === authorId);
    const rest = others.filter(b => !sameAuthor.includes(b));
    return [...sameAuthor, ...rest].slice(0, RELATED_COUNT);
}

function toReadingItem(blog) {
    return {
        key: blogPostKey(blog.slug),
        type: 'blog',
        title: blog.title,
        to: `/blogs/${blog.slug}`,
        image: blog.thumbnail?.link,
        subtitle: blog.author?.name ?? blog.author?.slEmail,
    };
}

export default function Blog() {
    const navigate = useNavigate();
    const { blogSlug } = useParams();
    const { wsSend } = useWebSocket();
    const [userInfo] = useUserInfo();
    const [blog, setBlog] = useState({});
    const [related, setRelated] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const postKey = blogPostKey(blogSlug);
    const isLoggedIn = handleCheckLoggedIn(userInfo.sessionExp);
    const isAuthor = isLoggedIn && blog.author?._id && blog.author._id === userInfo._id;

    const { html, headings } = useMemo(() => buildToc(sanitizeArticle(blog.content)), [blog.content]);
    const showToc = headings.length >= MIN_TOC_HEADINGS;

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
                setPageMeta({
                    title: data.blog.title,
                    description: excerpt(data.blog.content),
                    image: data.blog.thumbnail?.link,
                });
                setBlog(data.blog);
                recordRead(toReadingItem(data.blog));
                getRelated(data.blog);
            } catch (err) {
                console.log(err);
                navigate(`/blogs`);
            } finally {
                setIsLoading(false);
            }
        }

        async function getRelated(current) {
            try {
                const data = await request.get('api/blogs');
                setRelated(pickRelated(Array.isArray(data?.blogs) ? data.blogs : [], current));
            } catch (err) {
                console.log(err);
            }
        }
    }, [blogSlug, navigate])

    // Live comments: join this post's room while reading it
    useEffect(() => {
        try {
            wsSend({ action: 'join_post', message: postKey });
        } catch (err) {
            console.log(err);
        }
        return () => {
            try {
                wsSend({ action: 'join_post', message: '' });
            } catch (err) {
                console.log(err);
            }
        }
    }, [postKey, wsSend])

    // Jump to a #heading from a shared link once the content is rendered
    useEffect(() => {
        if (!html || !window.location.hash) {
            return;
        }
        const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        el?.scrollIntoView({ block: 'start' });
    }, [html])

    async function handleDelete() {
        setIsDeleting(true);
        try {
            await request.del(`api/blogs/${blogSlug}`);
            toast.success('Đã xóa bài viết');
            navigate('/blogs');
        } catch (err) {
            console.log(err);
        } finally {
            setIsDeleting(false);
        }
    }

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
                    actions={
                        <div className={styles.actions}>
                            <HeartButton postKey={postKey} />
                            <BookmarkButton item={toReadingItem(blog)} />
                            <ShareButton title={blog.title} />
                            {isAuthor && (
                                <IconButton
                                    size="small"
                                    aria-label="Tùy chọn bài viết"
                                    onClick={event => setMenuAnchor(event.currentTarget)}
                                    sx={{ border: '1px solid var(--border-strong)', width: 31, height: 31 }}
                                >
                                    <IoEllipsisHorizontal />
                                </IconButton>
                            )}
                        </div>
                    }
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

            <div className={`container ${styles.layout} ${showToc ? styles.withToc : ''}`}>
                <div className={styles.main}>
                    {showToc && (
                        <details className={styles.tocInline}>
                            <summary>Mục lục · {headings.length} phần</summary>
                            <TableOfContents headings={headings} />
                        </details>
                    )}

                    <div className={`prose ${styles.content}`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />

                    <section className={styles.reactRow}>
                        <div>
                            <h2>Bạn thấy bài viết thế nào?</h2>
                            <p>Thả một trái tim để tác giả biết bài viết có ích với bạn.</p>
                        </div>
                        <HeartButton postKey={postKey} variant="large" />
                    </section>

                    <aside className={styles.authorCard}>
                        <Avatar name={author} size={56} />
                        <div>
                            <div className={styles.authorLabel}>Viết bởi</div>
                            <div className={styles.authorName}>{author}</div>
                            <p>Cảm ơn bạn đã đọc đến cuối! Nếu thấy hữu ích, hãy chia sẻ bài viết cho bạn bè nhé.</p>
                        </div>
                    </aside>

                    <div className={styles.comments}>
                        <CommentContainer storySlug={postKey} writerId={blog.author?._id} />
                    </div>
                </div>

                {showToc && (
                    <aside className={styles.tocAside}>
                        <TableOfContents headings={headings} />
                    </aside>
                )}
            </div>

            <section className={`container ${styles.related}`}>
                {related.length > 0 ? (
                    <>
                        <div className={styles.relatedHead}>
                            <div>
                                <div className="eyebrow">Đọc tiếp</div>
                                <h2>Có thể bạn sẽ thích</h2>
                            </div>
                            <Link to="/blogs" className={styles.relatedAll}>Tất cả bài viết <IoArrowForward /></Link>
                        </div>
                        <div className="card-grid">
                            {related.map(item => <BlogItem key={item._id} blog={item} />)}
                        </div>
                    </>
                ) : (
                    <div className={styles.more}>
                        <Link to="/blogs" className={styles.moreLink}>
                            <span>Tiếp tục đọc</span>
                            <strong>Khám phá các bài viết khác</strong>
                        </Link>
                        <Button variant="contained" endIcon={<IoArrowForward />} onClick={() => navigate('/blogs')}>
                            Xem blog
                        </Button>
                    </div>
                )}
            </section>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => navigate(`/blogs/${blogSlug}/edit`)}>
                    <ListItemIcon><IoCreateOutline /></ListItemIcon>
                    Chỉnh sửa
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setMenuAnchor(null);
                        setIsConfirmingDelete(true);
                    }}
                    sx={{ color: 'var(--danger)' }}
                >
                    <ListItemIcon sx={{ color: 'inherit' }}><IoTrashOutline /></ListItemIcon>
                    Xóa bài viết
                </MenuItem>
            </Menu>

            <Dialog open={isConfirmingDelete} onClose={() => !isDeleting && setIsConfirmingDelete(false)}>
                <DialogTitle>Xóa bài viết này?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        “{blog.title}” sẽ không còn hiển thị với mọi người. Bình luận và lượt thả tim vẫn được giữ lại.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>Hủy</Button>
                    <LoadingButton color="error" variant="contained" loading={isDeleting} onClick={handleDelete}>
                        Xóa
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </article>
    )
}
