import { useEffect } from 'react';
import ArticleHeader from 'components/article/ArticleHeader';

export default function FacebookDataDeletionInstructions() {
    useEffect(() => {
        document.title = "Facebook Data Deletion Instructions | FollMe";
    }, []);

    return (
        <div className="container container--narrow" style={{ paddingBottom: 72 }}>
            <ArticleHeader
                eyebrow="Documents"
                title="Facebook Data Deletion Instructions URL"
            />
            <div className="prose">
                <p>
                    FollMe Login is a facebook login app and we do not save your personal data in our server. According to Facebook policy, we have to provide User Data Deletion Callback URL or Data Deletion Instructions URL.
                </p>
                <p>
                    If you want to delete your activities for FollMe Login App, you can remove your information by following these steps:
                </p>
                <ol>
                    <li>Go to your Facebook Account’s <b>Setting &amp; Privacy</b>. Click <b>Settings</b></li>
                    <li>Scroll down to <b>Security</b> and click <b>Apps and Websites</b>, you will see all of the apps and websites you linked with your Facebook.</li>
                    <li>Find and Click <span className="keyText">FollMe</span> app.</li>
                    <li>Click <b>Remove</b>.</li>
                    <li>Congratulations, you have successfully removed your app activities.</li>
                </ol>
                <p>
                    Please contact <span className="keyText">hello.follme@gmail.com</span> if there are any problems.
                </p>
            </div>
        </div>
    )
}
