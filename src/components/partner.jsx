import './partner.css';
import {useEffect, useRef} from 'react';

function Partner(props){
    const partnerVideo = useRef({});

    useEffect(() => {
        console.log("før lytteren");
        props.peerConnection.addEventListener('track', (event) => {
            partnerVideo.current.srcObject = event.streams[props.reRenderNumb-1];
            console.log("EventTarget");
        }); 
    },[]);

    return (
        <div>
            <video autoPlay={true} ref={partnerVideo} muted>
                    Your browser does not support the video tag.
                    {props.reRenderNumb}
            </video>
        </div>
    )
}

export default Partner;