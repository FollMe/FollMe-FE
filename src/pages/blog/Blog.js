import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from 'util/request';
import OvalLoading from 'components/loading/OvalLoading';
import { formatDate } from 'util/date.js';

import styles from "./Blog.module.scss";

export default function Blog() {
    const navigate = useNavigate();
    const { blogSlug } = useParams();
    const [blog, setBlog] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0)
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

    return (
        <>
            <div className={styles.blogContent}>
                {
                    isLoading ? <OvalLoading /> :
                        <div className={styles.boxContent}>
                            <img className={styles.thumbnail} alt='thumbnail' src={blog.thumbnail?.link ?? '#'}
                                onError={e => {
                                    e.target.src = "/imgs/default-story-background.webp";
                                }}
                            />
                            <div className={styles.chapNumber}>
                                <h2>{blog.title}</h2>
                            </div>
                            <p> Author: {blog.author.name ?? blog.author.slEmail}</p>
                            <p> Updated at: {formatDate(blog.updatedAt)}</p>
                            <hr />
                            <div className={styles.content}
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            >
                            </div>
                        </div>
                }
            </div>
        </>
    )
}