import './room.css';
import {useState, useEffect, useRef} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");


function Room(props) {
    const [id, setId] = useState("");
    const [peers, setPeers] = useState({});
    const peerRef = useRef({});
    const videoRef = useRef();
    const partnerVideos = useRef({});
    const videoStream = useRef();
    

    useEffect(() => {
        initializeSocket();
        initializeVideo();
    },[]);

    const initializeSocket = () => {
        const roomId = window.location.href.toString().split("/")[window.location.href.toString().split("/").length-1];
        socket.emit("my_name_is");
        socket.emit("joinRoom", roomId);
        socket.on("you", (myId) => {
            setId(myId);
        });
        socket.on("joinedRoom", (peersConnected) => {
            setPeers(peersConnected);
            for(const peerID of Object.values(peers)){
                console.log(peersConnected)
                makeCall(peerID)
            }
        });
        socket.on("offer", async (message) => {
            await receiveCall(message);
        });

        socket.on('candidate', async (message) => { 
            if (message.candidate) {
                try {
                    await peerRef.current[message.senderId].addIceCandidate(message.candidate);
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socket.on('answer', async message => {
            if (message.answer) {
                console.log("ans")
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerRef.current[message.senderId].setRemoteDescription(remoteDesc);
            }
        });
        window.addEventListener("beforeunload", (ev) => 
        {  
            ev.preventDefault();
            socket.emit("leaveRoom", roomId)
        });
        
    };

    const initializeVideo = () => {
        const constraints = {
            'video': {
                "width":500,
                "height":500
            },
            'audio': true
        }

        navigator.mediaDevices.getUserMedia(constraints)
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
        let renderedvids = [];
        for(const peerStream of Object.values(partnerVideos.current)){
            renderedvids.push(
                <video autoPlay={true} ref={peerStream} muted>
                Your browser does not support the video tag.
                </video>
            ); 
        }
        return renderedvids;
    };

    async function makeCall(peerId) {
        peerRef.current[peerId] = initializePeerConnection(peerId);
        videoStream.current.getTracks().forEach(track => {
            peerRef.current[peerId].addTrack(track, videoStream.current);
        });


        /*
        const chatChannel = peerConnection.createDataChannel('chat');
        chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
        chatChannel.onopen = () => {console.log('onopen')
            chatChannel.send("hola senorita");
            console.log(peerConnection)
        };
        chatChannel.onclose = () => console.log('onclose');*/

        const offer = await peerRef.current[peerId].createOffer();
        await peerRef.current[peerId].setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "senderId":id, "offer":offer});
    }

    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration);

        peerConnection.addEventListener('track', async (event) => {
            partnerVideos.current[peerId].srcObject = event.streams[0]
        }); 

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': peerId, 'candidate': event.candidate});
            }
        };
        return peerConnection;
    }
    

    const receiveCall = async (message) => {
        peerRef.current[message.senderId] = initializePeerConnection(message.senderId);
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
            console.log("of")
            peerRef.current[message.senderId].setRemoteDescription(new RTCSessionDescription(message.offer));

            videoStream.current.getTracks().forEach(track => {
                peerRef.current[message.senderId].addTrack(track, videoStream.current);
            });

            const answer = await peerRef.current[message.senderId].createAnswer();
            await peerRef.current[message.senderId].setLocalDescription(answer);
            socket.emit('answer', {"senderId":id,"id":message.senderId,"answer":answer});
            
        }   
    }

    return (
        <div className="p2p">
            {renderUserVideo()}
            {renderPartnerVideo()}
        </div>
    );
}

export default Room;