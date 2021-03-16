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
    const partnerVideoStream = new MediaStream();
    const videoRef = useRef();
    const partnerVideoRef = useRef();
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);

    useEffect(() => {
        initializeSocket();
        initializeVideo();
        peerConnection.addEventListener('iceconnectionstatechange', event => {
            console.log("dgf: " + event);
            console.log(peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'connected') {
                setConnected(true);
                console.log("Sigmund er kul")
            }
        });

        peerConnection.addEventListener('track', async (event) => {
            console.log("inni listener")
            partnerVideoStream.addTrack(event.track, partnerVideoStream);
        }); 

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


    const findIceCandidates = (partnerId) => {
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': partnerId, 'candidate': event.candidate});
            }
        };

        socket.on('candidate', async (message) => { 
            console.log(peerConnection);           
            if (message.candidate) {
                try {
                    await peerConnection.addIceCandidate(message.candidate);
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });
    }

    const renderPeers = () => {
        const renderdPeers = [];
        for(const [peerId,name] of Object.entries(peers)){
            if(peerId !== id){
                renderdPeers.push(<p onClick={() => makeCall(peerId)} key={peerId}>{name}</p>);
            }
        }
        return renderdPeers;
        
    };

    const initializeVideo = () => {
        const constraints = {
            'video': {
                "width":500,
                "height":500
            },
            'audio': true
        }

        navigator.mediaDevices.getDisplayMedia(constraints)
            .then(stream => {
                setVideoStream(stream);
                let video = videoRef.current;
                video.srcObject = stream;
                
                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
        });

        
    };

    const renderUserVideo = () => {
        return (
        <video autoPlay={true} ref={videoRef} muted>
            Your browser does not support the video tag.
        </video>
        );
    };

    const renderPartnerVideo = () => {
        return (
        <video autoPlay={true} ref={partnerVideoRef} muted>
            Your browser does not support the video tag.
        </video>
        );
    };

    async function makeCall(peerId) {
        findIceCandidates(peerId);
        

        socket.on('answer', async message => {
            if (message.answer) {
                console.log(peerConnection);
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerConnection.setRemoteDescription(remoteDesc);
            }
        });

        /*
        const chatChannel = peerConnection.createDataChannel('chat');
        chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
        chatChannel.onopen = () => {console.log('onopen')
            chatChannel.send("hola senorita");
            console.log(peerConnection)
        };
        chatChannel.onclose = () => console.log('onclose');*/

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "senderId":id, "offer":offer});
    }
    

    const receiveCall = async (message) => {
        /*
        let chatChannel;
        peerConnection.ondatachannel = (event) => {
            if (event.channel.label == 'chat') {
                chatChannel = event.channel;
                chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
                chatChannel.onopen = () => {
                    console.log('onopen');
                    chatChannel.send("hola senor");
                }

                chatChannel.onclose = () => console.log('onclose');
            }
        };
        */

        findIceCandidates(message.senderId);
        if (message.offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', {"id":message.senderId,"answer":answer});
            
        }   
    }

    return (
        <div className="p2p">
            {renderUserVideo()}
            {connected ? renderPartnerVideo() : ""}
            {renderPeers()}
        </div>
    );
}

export default P2p;