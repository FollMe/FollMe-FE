import { BrowserRouter } from "react-router-dom"
import { ToastContainer } from 'react-toastify';
import Router from "./routes";
import 'react-toastify/dist/ReactToastify.css';


export default function App() {
    return (
        <BrowserRouter>
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <Router />
        </BrowserRouter>
    )
}