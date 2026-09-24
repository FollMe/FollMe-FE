import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Typography, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { request } from 'util/request';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OvalLoading from 'components/loading/OvalLoading';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import ArticleHeader from 'components/article/ArticleHeader';
import InvitationStatusTag from 'components/invitation/InvitationStatusTag';

import styles from "./Event.module.scss";
import { getHostURL } from 'util/stringUtil';

const columns = [
  { field: 'name', headerName: 'Tên', flex: 1, headerClassName: styles.tableHeader },
  { field: 'mail', headerName: 'Mail', flex: 1, headerClassName: styles.tableHeader },
  { field: 'viewed', headerName: 'Lượt xem', align: 'center', headerClassName: styles.tableHeader, width: 126 },
  {
    field: "action",
    headerName: "Action",
    sortable: false,
    headerClassName: styles.tableHeader,
    headerAlign: "center",
    align:"center",
    renderCell: (params) => {
      const handleClick = async (e) => {
        e.stopPropagation(); // don't select this row after clicking
        const invitationLink = `${getHostURL()}/invitations/${params.row._id}`;
        await navigator.clipboard.writeText(invitationLink);

        const tooltipElement = document.querySelector("[role='tooltip'] p");
        if (tooltipElement) {
          tooltipElement.innerText = "✓ Đã copy";
        }
      };

      return (
        <Tooltip placement="top" title={<Typography fontSize={"1.3rem"}>Copy link</Typography>}>
          <ContentCopyIcon
            sx={{width: 20, height: 20, color: "var(--text-2)", cursor: "pointer"}}
            onClick={handleClick}
          />
        </Tooltip>
      )
    }
  }
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
        const data = await request.get(`api/events/${eventId}`);
        if (!data.invitation) {
          navigate(`/events`);
          return;
        }
        document.title = `${data.invitation.title} | FollMe`;
        setEvent(data.invitation);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        navigate(`/events`);
      }
    }
  }, [eventId, navigate])

  if (isLoading) {
    return <OvalLoading />
  }

  const status = new Date(event.startAt) > new Date() ? 'upcoming' : 'happened';

  return (
    <div className={`container ${styles.page}`}>
      <ArticleHeader
        back={{ to: '/events', label: 'Tất cả sự kiện' }}
        eyebrow="Sự kiện"
        title={event.title}
        meta={[
          <><AccessTimeIcon /> {dayjs(event.startAt).format('HH:mm · DD/MM/YYYY')}</>,
          <><LocationOnIcon /> {event.location}</>,
        ]}
        actions={<InvitationStatusTag status={status} />}
      />

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Khách mời</h2>
          <span>{event.guests?.length ?? 0} người</span>
        </div>
        <Box sx={{ height: 420, width: '100%' }}>
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
      </section>
    </div>
  )
}
