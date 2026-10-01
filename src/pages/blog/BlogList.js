import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { IoCreateOutline, IoSearchOutline, IoClose } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import BlogItem from 'components/blog/BlogItem';
import { PostCardSkeleton } from 'components/cards/PostCard';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import { useUserInfo } from 'customHooks/useUserInfo';
import { request } from 'util/request';
import { handleCheckLoggedIn } from "util/authHelper";
import { getSortingValue } from 'util/stringUtil';
import { searchItems } from 'util/search';
import { blogPostKey, reactionApi } from 'util/reaction';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userInfo] = useUserInfo();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);
  const sort = getSortingValue(searchParams.get('sort'));
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const getBlogs = useCallback(async (sort) => {
    try {
      setIsLoading(true);
      const queryParams = []
      if (sort) {
        queryParams.push(`sort=${sort}`);
        setSearchParams(prev => {
          prev.set('sort', sort);
          return prev;
        }, { replace: true });
      }

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
      populateHearts(blogs);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function populateHearts(blogs) {
    try {
      const counts = await reactionApi.counts(blogs.map(blog => blogPostKey(blog.slug)));
      setBlogs(current => current.map(blog => ({ ...blog, hearts: counts[blogPostKey(blog.slug)] ?? 0 })));
    } catch (err) {
      console.log(err);
    }
  }

  function handleSearch(value) {
    setQuery(value);
    setSearchParams(prev => {
      if (value.trim()) {
        prev.set('q', value);
      } else {
        prev.delete('q');
      }
      return prev;
    }, { replace: true });
  }

  const results = useMemo(
    () => (query.trim()
      ? searchItems(blogs, query, blog => `${blog.title} ${blog.author?.name ?? ''}`)
      : blogs),
    [blogs, query]
  );
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    document.title = "Blog | FollMe";
    const sort = searchParams.get('sort')
    getBlogs(sort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showFeatured = !isSearching && sort === '-updatedAt' && blogs.length > 2;
  const [featured, ...rest] = results;

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
        <div className="toolbar__group">
          <TextField
            size="small"
            placeholder="Tìm bài viết…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            inputProps={{ 'aria-label': 'Tìm bài viết' }}
            sx={{ width: { xs: '100%', sm: 280 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><IoSearchOutline /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Xóa tìm kiếm" onClick={() => handleSearch('')}>
                    <IoClose />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <ToggleButtonGroup value={sort} exclusive onChange={onSorting} aria-label="Sắp xếp" size="small">
            <ToggleButton value="-updatedAt">Mới nhất</ToggleButton>
            <ToggleButton value="updatedAt">Cũ nhất</ToggleButton>
          </ToggleButtonGroup>
        </div>
        {!isLoading && (
          <span className="toolbar__count">
            {isSearching ? `${results.length} / ${blogs.length} bài viết` : `${blogs.length} bài viết`}
          </span>
        )}
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
        ) : results.length <= 0 ? (
          <div className="empty-state">Không có bài viết nào khớp với “{query}”.</div>
        ) : (
          <>
            {showFeatured && (
              <div className="fade-up" style={{ marginBottom: 24 }}>
                <BlogItem blog={featured} variant="featured" />
              </div>
            )}
            <div className="card-grid stagger">
              {(showFeatured ? rest : results).map(blog =>
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
