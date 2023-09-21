import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Typography, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { request } from 'util/request';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OvalLoading from 'components/OvalLoading';

import styles from "./Event.module.scss";
import { formatDateTime } from 'util/date';

const columns = [
  { field: 'mail', headerName: 'Mail', flex: 1, headerClassName: styles.tableHeader },
  { field: 'viewed', headerName: 'Lượt xem', align: 'center', headerClassName: styles.tableHeader, width: 126 },
]

export default function Event() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0)
    getEvent();

    async function getEvent() {
      setIsLoading(true);
      try {
        const data = await request.get(`api/invitations/${eventId}`);
        if (!data.invitation) {
          navigate(`/events`);
          return;
        }
        document.title = `Invitation | FollMe`;
        setEvent(data.invitation);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        navigate(`/events`);
      }
    }
  }, [eventId, navigate])

  return (
    <>
      <div className={styles.blogContent}>
        {
          isLoading ? <OvalLoading /> :
            <div className={styles.boxContent}>
              <div className={styles.chapNumber}>
                <b>Sự kiện: {event.title}</b>
              </div>
              <hr />
              <Typography className={styles.eventField} variant="body" color="text.primary" component="div" sx={{ paddingBottom: 0.5 }}>
                <AccessTimeIcon /> {formatDateTime(event.startAt)}
              </Typography>
              <Typography className={styles.eventField} variant="body" color="text.primary" component="div" sx={{ paddingBottom: 0.5 }}>
                <LocationOnIcon /> {event.location}
              </Typography>

              <Box sx={{ height: 400, width: '100%', mt: '50px' }}>
                <DataGrid
                  rows={event.guests}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 5,
                      },
                    },
                  }}
                  pageSizeOptions={[5]}
                  disableRowSelectionOnClick
                  getRowId={(row) => row._id}
                  slots={{
                    noRowsOverlay: () => (
                      <Stack height="100%" alignItems="center" justifyContent="center">
                        Chưa có khách mời nào
                      </Stack>
                    ),
                    noResultsOverlay: () => (
                      <Stack height="100%" alignItems="center" justifyContent="center">
                        Không tìm thấy khách mời
                      </Stack>
                    )
                  }}
                />
              </Box>
            </div>
        }
      </div>
    </>
  )
}
