import './p2p.css';
import {useState, useEffect, useRef} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");

function P2p(props) {
    const [id, setId] = useState("");
    const [videoStream, setVideoStream] = useState(null);
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState({});
    const [receivingCall, setReceivingCall] = useState(false);
    const [partnerVideoStream, setPartnerVideoStream] = useState(null);
    const videoRef = useRef(null);
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);

    useEffect(() => {
        initializeSocket();
    },[]);

    const initializeSocket = () => {
        socket.emit("my_name_is",props.name);

        socket.on("you", (myId) => {
            setId(myId);
        });
        socket.on("peers", (peersConnected) => {
            setPeers(peersConnected);
        });
        socket.on("offer", async (message) => {
            await receiveCall(message);
        });
    };

    const renderPeers = () => {
        const renderdPeers = [];
        for(const [peerId,name] of Object.entries(peers)){
            if(peerId !== id){
                renderdPeers.push(<p onClick={() => makeCall(peerId)}>{name}</p>);
            }
        }
        return renderdPeers;
    };

    const initializeVideo = () => {
        const constraints = {
            'video': {
                "width":100,
                "height":100
            },
            'audio': true
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                setVideoStream(stream);
                let video = videoRef.current;
                video.srcObject = stream;
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });
    };

    const renderUserVideo = () => {
        if(!navigator.getMediaDevices) return;
        initializeVideo();
        return (
        <video autoplay="true" ref={videoRef} muted>
            Your browser does not support the video tag.
        </video>
        );
    };

    async function makeCall(peerId) {
        videoStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, videoStream);
        });        
        socket.on('answer', async message => {
            if (message.answer) {
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerConnection.setRemoteDescription(remoteDesc);
            }
        });
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "offer":offer});
    }
    

    const receiveCall = async (message) => {
        if (message.offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', answer);
        }

        peerConnection.addEventListener('track', async (event) => {
            partnerVideoStream.addTrack(event.track, partnerVideoStream);
        });        
    }

    return (
        <div className="p2p">
            <p>hello</p>
            {renderUserVideo()}
            {renderPeers()}
        </div>
    );
}

export default P2p;