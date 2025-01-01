import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import BlogSkeleton from 'components/skeletons/BlogSkeleton';
import BlogItem from 'components/blog/BlogItem';
import { useUserInfo } from 'customHooks/useUserInfo';
import { request } from 'util/request';
import { handleCheckLoggedIn } from "util/authHelper";
import { getSortingValue } from 'util/stringUtil';

import styles from "./BlogList.module.scss";
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';

export default function BlogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userInfo] = useUserInfo();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestLoginDialog, setShowRequestLoginDialog] = useState(false);
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
    (event) => {
      getBlogs(event.target.value);
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
        <FormControl>
          <Select
            labelId="demo-simple-select-label"
            className={styles.selectSort}
            defaultValue='-updatedAt'
            value={getSortingValue(searchParams.get('sort'))}
            onChange={onSorting}
          >
            <MenuItem value='-updatedAt'>Newest</MenuItem>
            <MenuItem value='updatedAt'>Oldest</MenuItem>
          </Select>
        </FormControl>
        <Paper variant="outlined" sx={{ marginTop: '10px', borderRadius: '8px', padding: '16px' }}>
          {
            isLoading ? (
              <>
                <BlogSkeleton />
                <Divider sx={{ margin: '20px 0' }} />
                <BlogSkeleton />
                <Divider sx={{ margin: '20px 0' }} />
                <BlogSkeleton />
              </>
            ) : blogs.length <= 0
              ? <> Hiện chưa có blog nào </>
              : blogs.map((blog, index) =>
                <div key={blog._id}>
                  <BlogItem blog={blog} />
                  {
                    index < blogs.length - 1 ? <Divider sx={{ margin: '20px 0' }} /> : ""
                  }
                </div>
              )
          }
        </ Paper>
      </div>
      {
        showRequestLoginDialog
        && <RequestSignInDialog open={true} setOpen={setShowRequestLoginDialog} action="truy cập" />
      }
    </div>
  )
}