import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import RocketIcon from '@mui/icons-material/Rocket'; import 'quill/dist/quill.snow.css'; // Add css for snow theme
import styles from './CreateBlog.module.scss';
import './CreateBlog.css';

const toolbar = [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
    ['link', 'image'],
    [{ color: [] }],
    ['code-block', 'blockquote', 'formula']
];

const options = {
    modules: {
        toolbar
    },
    placeholder: 'Compose an epic...',
    theme: 'snow'
};


export default function CreateBlog() {
    const quillRef = useRef();
    const [txtLabel, setTxtLabel] = useState("");

    useEffect(() => {
        document.title = "Blog | FollMe";
    }, [])

    useEffect(() => {
        const editor = new Quill(quillRef.current, options);
    }, []);

    return (
        <div className={styles.createContainer}>
            <div className={styles.inpBlogTitle}>
                <TextField
                    id="outlined-multiline-flexible"
                    label="Title"
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
                />
                <div className={styles.txtCounter}>{txtLabel.length}/150</div>
            </div>
            <div className={styles.editorContainer}>
                <div ref={quillRef} />
            </div>
            <div className={styles.createBlogFooter}>
                <div className={styles.quote}>
                    Thank you so much for your sharing❤️
                </div>
                <div className={styles.createBlogFooter_function}>
                    <Button className={styles.btnPostBlog} variant="contained" endIcon={<RocketIcon />}
                        sx={{
                            backgroundColor: 'var(--theme-color)',
                            textTransform: 'none',
                            fontSize: '1.2rem',
                        }}
                    >
                        Post
                    </Button>
                </div>
            </div>
        </div>
    )
}