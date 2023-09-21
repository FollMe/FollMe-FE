import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { DateTimeField } from '@mui/x-date-pickers';
import { request } from 'util/request';
import * as yup from 'yup';
import LoadingButton from '@mui/lab/LoadingButton';
import RocketIcon from '@mui/icons-material/Rocket';
import dayjs from 'dayjs';

import styles from "./CreateEvent.module.scss";
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

const validationSchema = yup.object({
  title: yup
    .string()
    .required('Vui lòng nhập tên sự kiện')
    .min(3, 'Tên phải có ít nhất 3 kí tự'),
  location: yup
    .string()
    .required('Vui lòng nhập địa điểm')
    .min(3, 'Địa điểm phải có ít nhất 3 kí tự'),
});

export default function CreateEvent() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  function onChangeGuests(_, value, reason) {
    if (reason !== 'createOption') {
      setGuests(value);
      return;
    }
    if (!emailRegex.test(value[value.length - 1])) {
      setEmailInput(value[value.length - 1]);
      return;
    }
    setGuests(value)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const formik = useFormik({
    initialValues: {
      title: '',
      startAt: dayjs('2023-06-21 14:52:00.691Z'),
      location: '',
      mapLocation: '',
      guests: [],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setIsPosting(true);
        const event = await request.post('api/invitations', { ...values, guests });
        console.log(event);
        navigate(`/invitations/${event._id}`)
      } catch (err) {
        setIsPosting(false);
        console.log(err);
      }
    },
  });

  return (
    <>
      <div className={styles.blogContent}>
        <div className={styles.boxContent}>
          <div className={styles.chapNumber}>
            <b>Tạo sự kiện</b>
          </div>
          <hr />
          <form className={styles.createEventForm} onSubmit={formik.handleSubmit}>
            <TextField style={{ fontSize: '1.5rem' }} fullWidth label="Tên sự kiện*"
              name='title'
              value={formik.values.title}
              onChange={(...params) => {console.log(params); formik.handleChange(...params)}}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
            <DateTimeField
              className={styles.inputFiled}
              name='startAt'
              sx={{ mr: '16px' }}
              label="Thời gian*"
              format='DD-MM-YYYY hh:mm A'
              value={formik.values.startAt}
              onChange={value => formik.handleChange({target: {value, name: 'startAt'}, type: 'change'})}
              onBlur={formik.handleBlur}
              error={formik.touched.startAt && Boolean(formik.errors.startAt)}
              helperText={formik.touched.startAt && formik.errors.startAt}
            />
            <TextField className={styles.inputFiled} fullWidth label="Địa điểm*"
              name='location'
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
            />
            <TextField className={styles.inputFiled} fullWidth label="Link GG Map"
              name='mapLocation'
              value={formik.values.mapLocation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mapLocation && Boolean(formik.errors.mapLocation)}
              helperText={formik.touched.mapLocation && formik.errors.mapLocation}
            />
            <Autocomplete
              className={styles.inputFiled}
              clearIcon={false}
              options={[]}
              value={guests}
              onChange={onChangeGuests}
              inputValue={emailInput}
              onInputChange={(_, value) => setEmailInput(value.toLowerCase())}
              freeSolo
              multiple
              renderTags={(value, props) =>
                value.map((option, index) => (
                  <Chip label={option} {...props({ index })} />
                ))
              }
              renderInput={(params) =>
                <TextField label="Mail khách mời" {...params}
                />
              }
            />
            <div className={styles.funcBox}>
              <LoadingButton variant="contained"
                loading={isPosting}
                loadingPosition="end"
                endIcon={<RocketIcon />}
                type='submit'
              >
                Tạo
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
