import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import Button from '@mui/material/Button';
import BlotFormatter from 'quill-blot-formatter';
import StartIcon from '@mui/icons-material/Start';
import CreateBlogModel from "./CreateBlogModel";
import { MIN_CONTENT_CHARACTER } from 'config/constant'
import { request } from "util/request";
import { toast } from 'react-toastify';

import 'quill/dist/quill.snow.css';
import './QuillStylesOverride.css';
import styles from './CreateBlog.module.scss';
import blogStyles from "./Blog.module.scss";


Quill.register('modules/blotFormatter', BlotFormatter);

const toolbar = [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
    ['link', 'image'],
    [{ color: [] }],
    ['code-block', 'blockquote']
];

const options = {
    modules: {
        toolbar,
        blotFormatter: {}
    },
    placeholder: 'Soạn một tuyệt tác...',
    theme: 'snow'
};

export default function CreateBlog() {
    const quillRef = useRef();
    const content = useRef('');
    const rawContent = useRef('');
    const [isOpenCreateModel, setIsOpenCreateModel] = useState(false);

    function handleOpenCreateModel() {
        // Validate content length
        const contentLength = content.current.trim().length;
        if (contentLength < MIN_CONTENT_CHARACTER) {
            toast.error(`Nội dung yêu cầu có ít nhất ${MIN_CONTENT_CHARACTER} kí tự`);
            return;
        }

        setIsOpenCreateModel(true);
    }
    function handleCloseCreateModel() {
        setIsOpenCreateModel(false);
    }

    function handlePostBlog(title, image) {
        const data = new FormData();
        data.append('thumbnail', image);
        data.append('title', title);
        data.append('content', rawContent.current);
        return request.post('api/blogs', data, true);
    }

    useEffect(() => {
        document.title = "Blog | FollMe";
        if (quillRef.current.childNodes.length) {
            return;
        }
        const editor = new Quill(quillRef.current, options);
        editor.clipboard.addMatcher("p", (_, delta) => {
            const op = delta.ops[0];
            if (typeof op.insert.replace == 'function') {
                op.insert = op.insert?.replace("\n\n", "\n");
            }
            return delta;
        });

        editor.on('text-change', () => {
            content.current = editor.getText();
            rawContent.current = editor.root.innerHTML;
        })
    }, [])

    return (
        <div className={styles.createContainer}>
            <div className={styles.createBlogFooter}>
                <div className={styles.nextBlogFooter_function}>
                    <Button className={styles.btnReviewBlog} variant="contained" endIcon={<StartIcon />}
                        sx={{
                            backgroundColor: 'var(--theme-color)',
                            textTransform: 'none',
                            fontSize: '1.2rem',
                        }}
                        onClick={handleOpenCreateModel}
                    >
                        Tiếp tục
                    </Button>
                </div>
            </div>
            <div className={blogStyles.content}>
                <div ref={quillRef} />
            </div>
            <CreateBlogModel
                isOpen={isOpenCreateModel}
                onCloseCreateModel={handleCloseCreateModel}
                onPostBlog={handlePostBlog}
            />
        </div>
    )
}
