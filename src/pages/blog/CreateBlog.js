import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    const navigate = useNavigate();
    // Present when editing an existing blog (/blogs/:blogSlug/edit)
    const { blogSlug } = useParams();
    const isEditing = Boolean(blogSlug);
    const quillRef = useRef();
    const editorRef = useRef(null);
    const [editingBlog, setEditingBlog] = useState(null);
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
        if (image) {
            data.append('thumbnail', image);
        }
        data.append('title', title);
        data.append('content', rawContent.current);
        if (isEditing) {
            return request.putForm(`api/blogs/${blogSlug}`, data);
        }
        return request.post('api/blogs', data, true);
    }

    useEffect(() => {
        document.title = isEditing ? "Chỉnh sửa blog | FollMe" : "Viết blog | FollMe";
        if (quillRef.current.childNodes.length) {
            return;
        }
        const editor = new Quill(quillRef.current, options);
        editorRef.current = editor;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!isEditing) {
            return;
        }
        loadBlog();

        async function loadBlog() {
            try {
                const data = await request.get(`api/blogs/${blogSlug}/edit`);
                const blog = data?.blog;
                if (!blog) {
                    navigate('/blogs');
                    return;
                }
                setEditingBlog(blog);
                const editor = editorRef.current;
                editor.setContents([]);
                editor.clipboard.dangerouslyPasteHTML(0, blog.content ?? '');
                content.current = editor.getText();
                rawContent.current = editor.root.innerHTML;
            } catch (err) {
                console.log(err);
                navigate(`/blogs/${blogSlug}`);
            }
        }
    }, [isEditing, blogSlug, navigate])

    return (
        <div className={`container ${styles.createContainer}`}>
            <div className={styles.toolbar}>
                <div>
                    <div className="eyebrow">Blog</div>
                    <h1 className={styles.title}>{isEditing ? 'Chỉnh sửa bài viết' : 'Soạn bài viết mới'}</h1>
                    <p className={styles.hint}>
                        {isEditing && editingBlog ? <>Đang sửa “{editingBlog.title}”. </> : null}
                        Nội dung cần tối thiểu {MIN_CONTENT_CHARACTER} kí tự. Bạn sẽ {isEditing ? 'xem lại' : 'đặt'} tiêu đề và ảnh bìa ở bước tiếp theo.
                    </p>
                </div>
                <Button variant="contained" size="large" endIcon={<StartIcon />}
                    onClick={handleOpenCreateModel}
                >
                    Tiếp tục
                </Button>
            </div>
            <div className={`prose ${styles.editor}`}>
                <div ref={quillRef} />
            </div>
            <CreateBlogModel
                isOpen={isOpenCreateModel}
                onCloseCreateModel={handleCloseCreateModel}
                onPostBlog={handlePostBlog}
                isEditing={isEditing}
                initialTitle={editingBlog?.title}
                currentThumbnail={editingBlog?.thumbnail?.link}
            />
        </div>
    )
}
