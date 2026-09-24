import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { IoCreateOutline } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import BlogItem from 'components/blog/BlogItem';
import { PostCardSkeleton } from 'components/cards/PostCard';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import { useUserInfo } from 'customHooks/useUserInfo';
import { request } from 'util/request';
import { handleCheckLoggedIn } from "util/authHelper";
import { getSortingValue } from 'util/stringUtil';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userInfo] = useUserInfo();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);
  const sort = getSortingValue(searchParams.get('sort'));
  const isLoggedIn = useMemo(
    () => handleCheckLoggedIn(userInfo.sessionExp)
    , [userInfo]
  )

  function handleClickWriteBlog() {
    if (!isLoggedIn) {
      setShowRequestLoginDialog(true);
      return;
    }
    navigate('/blogs/create');
  }

  const onSorting = useCallback(
    (_, value) => {
      if (value) {
        getBlogs(value);
      }
    }, []);

  const getBlogs = useCallback(async (sort) => {
    try {
      setIsLoading(true);
      const queryParams = []
      if (sort) {
        queryParams.push(`sort=${sort}`);
        searchParams.set('sort', sort);
      }
      setSearchParams(searchParams);

      let url = 'api/blogs';
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      const res = await request.get(url);
      const blogs = res.blogs;
      if (!Array.isArray(blogs)) {
        return;
      }
      setBlogs(blogs);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Blog | FollMe";
    const sort = searchParams.get('sort')
    getBlogs(sort);
  }, [])

  const showFeatured = sort === '-updatedAt' && blogs.length > 2;
  const [featured, ...rest] = blogs;

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Blog"
        title="Ghi chép kỹ thuật"
        description="Những điều mình học được khi xây dựng phần mềm — từ thiết kế cơ sở dữ liệu, giao thức web cho tới Git và hơn thế nữa."
        actions={
          <Button variant="contained" size="large" startIcon={<IoCreateOutline />} onClick={handleClickWriteBlog}>
            Viết blog
          </Button>
        }
      />

      <div className="toolbar">
        <ToggleButtonGroup value={sort} exclusive onChange={onSorting} aria-label="Sắp xếp" size="small">
          <ToggleButton value="-updatedAt">Mới nhất</ToggleButton>
          <ToggleButton value="updatedAt">Cũ nhất</ToggleButton>
        </ToggleButtonGroup>
        {!isLoading && <span className="toolbar__count">{blogs.length} bài viết</span>}
      </div>

      {
        isLoading ? (
          <div className="card-grid">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : blogs.length <= 0 ? (
          <div className="empty-state">Hiện chưa có blog nào.</div>
        ) : (
          <>
            {showFeatured && (
              <div className="fade-up" style={{ marginBottom: 24 }}>
                <BlogItem blog={featured} variant="featured" />
              </div>
            )}
            <div className="card-grid stagger">
              {(showFeatured ? rest : blogs).map(blog =>
                <BlogItem key={blog._id} blog={blog} />
              )}
            </div>
          </>
        )
      }

      {
        showRequestLoginDialog
        && <RequestSignInDialog open={true} setOpen={setShowRequestLoginDialog} action="viết blog" />
      }
    </div>
  )
}
