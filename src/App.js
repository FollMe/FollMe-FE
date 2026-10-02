import { BrowserRouter } from "react-router-dom"
import { ToastContainer } from 'react-toastify';
import Router from "./routes";
import ScrollToTop from "components/layout/ScrollToTop";
import { useColorMode } from "customHooks/useColorMode";
import 'react-toastify/dist/ReactToastify.css';


export default function App() {
  const [mode] = useColorMode();

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
        theme={mode}
      />
      <ScrollToTop />
      <Router />
    </BrowserRouter>
  )
}
