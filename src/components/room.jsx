import './room.css';
import {useState, useEffect, useRef} from 'react';
import {socket} from "../socket";
import Partner from "./partner";


function Room(props) {
    let id = "";
    const [peerConnections,setPeerConnections] = useState({});
    const [reRenderNumb, setRerenderNumb] = useState(0);
    const videoRef = useRef();
    const videoStream = useRef();
    

    useEffect(() => {
        initialize();
    },[]);

    const initialize = async () => {
        await initializeVideo();
        initializeSocket();
    }

    const initializeSocket = () => {

        const roomId = window.location.href.toString().split("/")[window.location.href.toString().split("/").length-1];
        socket.emit("my_name_is");
        socket.emit("joinRoom", roomId);
        socket.on("you", (myId) => {
            id = myId;
            console.log(id);
        });
        socket.on("joinedRoom", (peersConnected) => {
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
                    await peerConnections[message.senderId].addIceCandidate(message.candidate);
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socket.on('answer', async message => {
            console.log("før if i ans")
            if (message.answer) {
                console.log(message)
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerConnections[message.senderId].setRemoteDescription(remoteDesc);
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
        console.log("runner denne flere ganger???");
        // for(const peerConnection in peerConnections){
        //     console.log(peerConnections);
        //     renderedvids.push(
        //         <Partner key={peerConnection} peerConnection={peerConnections[peerConnection]} reRenderNumb={reRenderNumb}></Partner>
        //     ); 
        // }

        
        return renderedvids;
    };

    const makeCall = async (peerId) => {
        const peerConnection =  initializePeerConnection(peerId);
        const  tempPeerConections = peerConnections
        tempPeerConections[peerId] = peerConnection;
        setPeerConnections(tempPeerConections);
        setRerenderNumb(reRenderNumb+1);

        videoStream.current.getTracks().forEach(track => {
            peerConnections[peerId].addTrack(track, videoStream.current);
        });


        /*
        const chatChannel = peerConnection.createDataChannel('chat');
        chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
        chatChannel.onopen = () => {console.log('onopen')
            chatChannel.send("hola senorita");
            console.log(peerConnection)
        };
        chatChannel.onclose = () => console.log('onclose');*/

        const offer = await peerConnections[peerId].createOffer();
        await peerConnections[peerId].setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "senderId":id, "offer":offer});
    }

    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration);

        // peerConnection.addEventListener('track', async (event) => {
        //     console.log(partnerVideos);
        //     partnerVideos.current[peerId] = event.streams[0];
        //     console.log(partnerVideos);
        // }); 

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': peerId, "senderId":id, 'candidate': event.candidate});
            }
        };

        return peerConnection;
    }
    

    const receiveCall = async (message) => {
        const peerConnection =  initializePeerConnection(message.senderId);
        const  tempPeerConections = peerConnections
        tempPeerConections[message.senderId] = peerConnection;
        setPeerConnections(tempPeerConections);
        setRerenderNumb(reRenderNumb+1);

        if (message.offer) {
            peerConnections[message.senderId].setRemoteDescription(new RTCSessionDescription(message.offer));

            videoStream.current.getTracks().forEach(track => {
                peerConnections[message.senderId].addTrack(track, videoStream.current);
            });
            const answer = await peerConnections[message.senderId].createAnswer();
            await peerConnections[message.senderId].setLocalDescription(answer);

            socket.emit('answer', {senderId:id,id:message.senderId,answer:answer});
            
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