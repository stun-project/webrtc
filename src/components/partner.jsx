import './partner.css';
import {useEffect, useRef} from 'react';

function Partner(props){
    const partnerVideo = useRef();

    useEffect(() => {
        console.log("før lytteren");
        props.peerConnection.addEventListener('track', (event) => {
            partnerVideo.current.srcObject = event.streams[0];
            console.log("EventTarget");
        }); 
    },[]);

    return (
        <div>
            <video autoPlay={true} ref={partnerVideo} muted>
                    Your browser does not support the video tag.
            </video>
            <p>tester litt bro</p>
        </div>
    )
}

export default Partner;