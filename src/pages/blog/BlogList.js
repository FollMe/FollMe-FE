import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import BlogSkeleton from 'components/skeletons/BlogSkeleton';
import BlogItem from 'components/blog/BlogItem';
import { useUserInfo } from 'customHooks/useUserInfo';
import { request } from 'util/request';

import styles from "./BlogList.module.scss";
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';

export default function BlogList() {
  const navigate = useNavigate();
  const [userInfo] = useUserInfo();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);
  const isLoggedIn = useMemo(() =>
    userInfo.sessionExp && new Date().getTime() <= userInfo.sessionExp * 1000
    , [userInfo]
  )

  function handleClickWriteBlog() {
    if (!isLoggedIn) {
      setShowRequestLoginDialog(true);
      return;
    }
    navigate('/blogs/create');
  }

  useEffect(() => {
    document.title = "Blog | FollMe";
    getBlogs();

    async function getBlogs() {
      try {
        setIsLoading(true);
        const res = await request.get('api/blogs');
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
    }
  }, [])

  return (
    <div className="containerMain">
      <div className="containerStory">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            Blogs
          </Typography>
          <Tooltip placement='left' title={<Typography fontSize={"1.3rem"}>Viết blog</Typography>}>
            <IconButton className={styles.btnAddNewBlog} variant="outlined" onClick={handleClickWriteBlog}>
              <DesignServicesIcon className={styles.btnAddBlog2} sx={{ fontSize: '40px' }} />
              <AddIcon className={styles.btnAddBlog} sx={{ fontSize: '40px' }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Paper variant="outlined" sx={{ marginTop: '20px', borderRadius: '8px', padding: '16px' }}>
          {
            isLoading ? (
              <>
                <BlogSkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <BlogSkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <BlogSkeleton />
              </>
            ) : blogs.length <= 0
              ? <> Hiện chưa có blog nào </>
              : blogs.map((blog, index) =>
                <div key={blog._id}>
                  <BlogItem blog={blog} />
                  {
                    index < blogs.length - 1 ? <Divider light sx={{ margin: '20px 0' }} /> : ""
                  }
                </div>
              )
          }
        </ Paper>
      </div>
      <RequestSignInDialog open={showRequestLoginDialog} setOpen={setShowRequestLoginDialog} action="viết blog" />
    </div>
  )
}