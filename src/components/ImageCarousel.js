import Carousel from 'react-material-ui-carousel'
import styles from './ImageCarousel.module.scss';

export default function ImageCarousel(props) {

    return (
        <Carousel
            indicatorIconButtonProps={{
                style: {
                    marginTop: '20px',
                    padding: '5px',
                    marginBottom: '20px',
                    color: '#ff6541',
                    opacity: 0.4
                }
            }}
            activeIndicatorIconButtonProps={{
                style: {
                    opacity: 1
                }
            }}
            animation="slide"
            duration={600}
        >
            <div className={styles.carouselItem}>
                <img className={styles.imgCarousel} alt="Share your story" src="imgs/S2_Lecture.jpg" />
                <div className={styles.titleBio}> Chia sẻ câu chuyện cá nhân </div>
            </div>
            <div className={styles.carouselItem}>
                <img className={styles.imgCarousel} alt="Founder" src="imgs/3 (2).jpg" />
                <div className={styles.titleBio}>
                    Tôi cảm thấy tự hào khi được chia sẻ câu chuyện của mình đến với mọi người!
                    <br /><br />
                    <b> - Quốc Sum - </b>
                </div>
            </div>
        </Carousel>
    )
}
