import { useEffect, useState } from "react";
import { useQuill } from 'react-quilljs';
import TextField from '@mui/material/TextField';
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import styles from './CreateBlog.module.scss';
import './CreateBlog.css';

export default function CreateBlog() {
    const { quill, quillRef } = useQuill();
    const [ txtLabel, setTxtLabel ] = useState("");

    useEffect(() => {
        document.title = "Blog | FollMe";
    }, [])

    useEffect(() => {
        if (quill) {
            quill.on('text-change', (delta, oldDelta, source) => {
                console.log('Text change!');
                console.log(quillRef.current.firstChild.innerHTML); // Get innerHTML using quillRef
            });
        }
    }, [quill]);

    return (
        <div className={styles.createContainer}>
            <div className={styles.inpBlogTitle}>
                <TextField
                    id="outlined-multiline-flexible"
                    label="Title"
                    name="title"
                    value={txtLabel}
                    // multiline
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
            <div className={styles.quote}>
                Thank you so much for your sharing❤️
            </div>
        </div>
    )
}