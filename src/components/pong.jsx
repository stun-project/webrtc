import './pong.css';
import {useState, useEffect, useRef} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");

function Pong(props) {
    const [id, setId] = useState("");
    const [connected, setConnected] = useState(false);
    const [peers, setPeers] = useState({});
    const [receivingCall, setReceivingCall] = useState(false);
    const peerRef = useRef();
    const videoRef = useRef();
    const partnerVideoRef = useRef();
    const videoStream = useRef();
    

    useEffect(() => {
        initializeSocket();
        initializeVideo();
    },[]);

    const initializeSocket = () => {
        // socket.emit("my_name_is",props.name);

        // socket.on("you", (myId) => {
        //     setId(myId);
        // });
        // socket.on("peers", (peersConnected) => {
        //     setPeers(peersConnected);
        // });
        // socket.on("offer", async (message) => {
        //     await receiveCall(message);
        // });

        // socket.on('candidate', async (message) => { 
        //     console.log(peerRef.current);           
        //     if (message.candidate) {
        //         try {
        //             await peerRef.current.addIceCandidate(message.candidate);
        //         } catch (e) {
        //             console.error('Error adding received ice candidate', e);
        //         }
        //     }
        // });

        // socket.on('answer', async message => {
        //     if (message.answer) {
        //         console.log(peerRef.current);
        //         const remoteDesc = new RTCSessionDescription(message.answer);
        //         await peerRef.current.setRemoteDescription(remoteDesc);
        //     }
        // });

        socket.emit("awaitingGame")

        
    };


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
                videoStream.current = stream;
                let video = videoRef.current;
                video.srcObject = stream;
                
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
        peerRef.current = initializePeerConnection(peerId);
        videoStream.current.getTracks().forEach(track => {
            peerRef.current.addTrack(track, videoStream.current);
        });


        /*
        const chatChannel = peerConnection.createDataChannel('chat');
        chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
        chatChannel.onopen = () => {console.log('onopen')
            chatChannel.send("hola senorita");
            console.log(peerConnection)
        };
        chatChannel.onclose = () => console.log('onclose');*/

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "senderId":id, "offer":offer});
    }

    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration);

        peerConnection.addEventListener('iceconnectionstatechange', event => {
            console.log("dgf: " + event);
            console.log(peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'connected') {
                setConnected(true);
                socket.emit("disconnect");
            }
        });

        peerConnection.addEventListener('track', async (event) => {
            console.log("inni listener")
            partnerVideoRef.current.srcObject = event.streams[0]
        }); 

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': peerId, 'candidate': event.candidate});
            }
        };
        return peerConnection;
    }
    

    const receiveCall = async (message) => {
        peerRef.current = initializePeerConnection(message.senderId);
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

        if (message.offer) {
            peerRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));

            videoStream.current.getTracks().forEach(track => {
                peerRef.current.addTrack(track, videoStream.current);
            });

            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            socket.emit('answer', {"id":message.senderId,"answer":answer});
            
        }   
    }

    return (
        <div className="p2p">
            {renderUserVideo()}
            {renderPartnerVideo()}
            <aside>
                {renderPeers()}
            </aside>
        </div>
    );
}

export default Pong;