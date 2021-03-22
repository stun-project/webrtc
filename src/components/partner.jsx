import './partner.css';
import {useEffect, useRef} from 'react';

function Partner(props){
    const partnerVideo = useRef();

    useEffect(() => {
        props.peerConnection.addEventListener('track', (event) => {
            partnerVideo.current.srcObject = event.streams[0];
        }); 
    },[]);

    return (
        <div style={props.styling.divStyle}>
            <video autoPlay={true} ref={partnerVideo} muted style={props.styling.videoStyle}>
                    Your browser does not support the video tag.
            </video>
        </div>
    )
}

export default Partner;