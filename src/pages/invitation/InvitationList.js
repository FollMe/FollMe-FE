import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { request } from 'util/request';
import StorySkeleton from 'components/skeletons/StorySkeleton';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import styles from "./InvitationList.module.scss";
import InvitationItem from 'components/invitation/InvitationItem';

export default function InvitationList() {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    document.title = "Invitation | FollMe";
    getInvitation();
    
    async function getInvitation() {
      try {
        setIsLoading(true);
        const res = await request.get('api/invitations');
        setIsLoading(false);
        const invitations = res.invitations;
        if (!Array.isArray(invitations)) {
          return;
        }
        setInvitations(invitations);
      } catch (err) {
        console.log(err);
      }
    }
  }, [])

  return (
    <div className="containerMain">
      <div className="containerStory">
        <Typography className={styles.txtPageTitle} gutterBottom variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          Thư mời điện tử
        </Typography>

        <Paper variant="outlined" sx={{ marginTop: '20px', borderRadius: '8px', padding: '16px' }}>
          {
            isLoading ? (
              <>
                <StorySkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <StorySkeleton />
                <Divider light sx={{ margin: '20px 0' }} />
                <StorySkeleton />
              </>
            ) : invitations.length <= 0
              ? <> Bạn chưa tạo sự kiện nào </>
              : invitations.map((invitation, index) =>
                <div key={invitation._id}>
                  <InvitationItem invitation={invitation} />
                  {
                    index < invitations.length - 1 ? <Divider light sx={{ margin: '20px 0' }} /> : ""
                  }
                </div>
              )
          }
        </ Paper>
      </div>
    </div>
  )
}