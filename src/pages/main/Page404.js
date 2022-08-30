import Animation404 from "components/animations/Animation404";


function Page404() {
    return (
        <div
            style={{
                display: 'flex',
                position: 'absolute',
                width: '100%',
                height: '100vh',
                top: '0',
                left: '0',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <span style={{ fontSize: '1.8rem', marginBottom: "5px" }}>
                <b>Không tìm thấy trang</b>
            </span>
            <Animation404 />
        </div>
    );
}

export default Page404;
