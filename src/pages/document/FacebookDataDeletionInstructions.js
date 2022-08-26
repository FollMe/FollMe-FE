import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import styles from "../story/Story.module.scss";

export default function FacebookDataDeletionInstructions() {
    return (
        <div className="container-view grid">
            <h2 className={styles.chapNumber}>
                <ArrowForwardIosIcon />
                Facebook Data Deletion Instructions URL
            </h2>
            <div className={styles.boxContent}>
                <pre className={styles.content}>
                    FollMe Login is a facebook login app and we do not save your personal data in our server. According to Facebook policy, we have to provide User Data Deletion Callback URL or Data Deletion Instructions URL.
                    <br />
                    If you want to delete your activities for FollMe Login App, you can remove your information by following these steps:
                    <ol>
                        <li>Go to your Facebook Account’s <b>Setting &amp; Privacy</b>. Click <b>Settings</b></li>
                        <li>Scroll down to <b>Security</b> and click <b>Apps and Websites</b>, you will see all of the apps and websites you linked with your Facebook.</li>
                        <li>Find and Click <span className="keyText">FollMe</span> app.</li>
                        <li>Click <b>Remove</b>.</li>
                        <li>Congratulations, you have successfully removed your app activities.</li>
                    </ol>
                    Please contact <span className="keyText">hello.follme@gmail.com</span> if there are any problems.
                </pre>
            </div>
            <footer>
                <img src="/imgs/follme-logo.png" alt="follme-logo" className="follme-logo" />
                <h4>FollMe</h4>
            </footer>
        </div>
    )
}