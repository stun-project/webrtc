import './p2p.css';
import {useState, useEffect} from 'react';
import { io } from "socket.io-client";

function P2p(props) {
    const [id, setId] = useState("");
    const [videoStream, setVideoStream] = useState(null);
    const [connected, setConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        setSocket(io());
        runVideo();
    });

    const runVideo = () => {
        const constraints = {
            'video': true,
            'audio': true
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                setVideoStream(stream);
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
        
    };

    return (
        <div className="p2p">
            <p>hello</p>
            <video autoplay="true" src={videoStream} muted>
                Your browser does not support the video tag.
            </video>
        </div>
    );
}

export default P2p;