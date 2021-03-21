import './room.css';
import {useState, useEffect, useRef} from 'react';
import {socket} from "../socket";


function Room(props) {
    const [id, setId] = useState("");
    const [peers, setPeers] = useState({});
    const peerRef = useRef({});
    const videoRef = useRef();
    const partnerVideos = useRef({});
    const videoStream = useRef();
    

    useEffect(() => {
        initialize();
    },[]);

    async function initialize(){
        await initializeVideo();
        initializeSocket();
    }

    const initializeSocket = () => {

        const roomId = window.location.href.toString().split("/")[window.location.href.toString().split("/").length-1];
        socket.emit("my_name_is");
        socket.emit("joinRoom", roomId);
        socket.on("you", (myId) => {
            setId(myId);
        });
        socket.on("joinedRoom", (peersConnected) => {
            setPeers(peersConnected);
            console.log(peersConnected);
            peersConnected.forEach( (peerID) => {
                console.log(peerID);
                makeCall(peerID);
            })
        });
        socket.on("offer", async (message) => {
            console.log("motatt offer");
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
    };

    const initializeVideo = async () => {
        const constraints = {
            'video': {
                "width":500,
                "height":500
            },
            'audio': true
        }

        await navigator.mediaDevices.getDisplayMedia(constraints)
            .then(stream => {
                videoStream.current = stream;
                let video = videoRef.current;
                video.srcObject = stream;
                
            }).then()
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
        
        for(const peerStream in partnerVideos){
   
            renderedvids.push(
                <video autoPlay={true} ref={ ref => {partnerVideos.current[peerStream] = ref}} muted>
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
        console.log("etter offer");
    }

    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration);

        peerConnection.addEventListener('track', async (event) => {
            console.log(partnerVideos);
            partnerVideos.current[peerId] = event.streams[0];
            console.log(partnerVideos);
        }); 

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': peerId, "senderId":id, 'candidate': event.candidate});
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