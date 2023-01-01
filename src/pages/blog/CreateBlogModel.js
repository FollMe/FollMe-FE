import { useState, forwardRef, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import DialogContentText from '@mui/material/DialogContentText';
import RocketIcon from '@mui/icons-material/Rocket';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import FileInput from '@uppy/file-input';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import '@uppy/file-input/dist/style.css';
import '@uppy/drag-drop/dist/style.css';
import '@uppy/progress-bar/dist/style.css';
import '@uppy/status-bar/dist/style.css';
import styles from './CreateBlogModel.module.scss';
import { MIN_TITLE_CHARACTER } from 'config/constant';

const Transition = forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

export default function CreateBlogModel({
    isOpen,
    onCloseCreateModel,
    onPostBlog
}) {
    const navigate = useNavigate();
    const [txtLabel, setTxtLabel] = useState("");
    const [errorLabel, setErrorLabel] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const uppy = useRef(new Uppy({
        allowMultipleUploadBatches: false,
        restrictions: {
            maxNumberOfFiles: 1,
            minNumberOfFiles: 1,
            allowedFileTypes: ['image/*']
        }
    }).use(FileInput))

    async function handlePostBlog() {
        try {
            setIsPosting(true);
            const label = txtLabel.trim();
            if (label.length < 3) {
                setErrorLabel(true);
                return;
            }
            const thumbnail = uppy.current.getFiles().length > 0
                ? uppy.current.getFiles()[0].data
                : undefined;
            await onPostBlog(label, thumbnail);
            navigate('/blogs');
        } catch (err) {
            console.log(err);
        } finally {
            setIsPosting(false);
        }
    }

    return (
        <div>
            <Dialog
                TransitionComponent={Transition}
                open={isOpen}
            >
                <DialogTitle>Chia sẻ blog của bạn</DialogTitle>
                <DialogContent>
                    <div className={styles.inpBlogTitle}>
                        <TextField
                            error={errorLabel}
                            id="outlined-multiline-flexible"
                            label="Tiêu đề"
                            name="title"
                            value={txtLabel}
                            maxRows={2}
                            InputLabelProps={{
                                sx: {
                                    fontSize: '1.4rem'
                                }
                            }}
                            fullWidth
                            inputProps={{ maxLength: 150 }}
                            onChange={e => setTxtLabel(e.target.value)}
                            onFocus={() => setErrorLabel(false)}
                            helperText={`Tiêu đề phải có ít nhất ${MIN_TITLE_CHARACTER} kí tự!`}
                        />
                        <div className={styles.txtCounter}>{txtLabel.trim().length}/150</div>
                    </div>
                    <DialogContentText>
                        Mẹo: Thêm ảnh bìa giúp blog của bạn trở nên hấp dẫn hơn!
                    </DialogContentText>
                    <Dashboard uppy={uppy.current} plugins={['FileInput']} hideUploadButton={true} height={400} />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={onCloseCreateModel} disabled={isPosting}>
                        Hủy
                    </Button>
                    <LoadingButton variant="contained"
                        loading={isPosting}
                        onClick={handlePostBlog}
                        loadingPosition="end"
                        endIcon={<RocketIcon />}
                    >
                        Đăng
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </div>
    );
}
