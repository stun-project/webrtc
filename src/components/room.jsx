import './room.css';
import {useState, useEffect, useRef} from 'react';
import {socket} from "../socket";
import Partner from "./partner";


function Room(props) {
    let id = "";
    const [peerConnections,setPeerConnections] = useState({});
    const [peerConnectionArr, setPeerConnectionArr] = useState([]); //for rendering purposes
    const videoRef = useRef();
    const videoStream = useRef();
    const styling = {
        videoStyle:{
            width:1280/(peerConnectionArr.length+1),
            margin: 10
        },
        divStyle:{
            "min-width": 350,
            display:"inline"
        }
    }

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
        });
        socket.on("joinedRoom", (peersConnected) => {
            if(peersConnected !== undefined && peersConnected !== null){
                peersConnected.forEach( (peerId) => {
                    makeCall(peerId);
                });
            }
        });
        socket.on("offer", async (message) => {
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
            if (message.answer) {
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerConnections[message.senderId].setRemoteDescription(remoteDesc);
            }
            
        });        
    };

    const initializeVideo = async () => {
        const constraints = {
            'video': {
                "width":1280,
                "height":720
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
        if(peerConnectionArr.length > 4){
            styling.videoStyle = {
                width: 1280/3,
                margin: 10
            }
        }
        else if(peerConnectionArr.length > 2){
            styling.videoStyle = {
                width: 1280/2,
                margin: 10
            }
        }

        return (
            <div style={styling.divStyle}>
                <video autoPlay={true} ref={videoRef} muted style={styling.videoStyle}>
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    };

    const renderPartnerVideo = () => {
        if(peerConnectionArr.length > 4){
            styling.videoStyle = {
                width: 1280/3,
                margin: 10
            }
        }
        else if(peerConnectionArr.length > 2){
            styling.videoStyle = {
                width: 1280/2,
                margin: 10
            }
        }

        return peerConnectionArr.map((peerConnection) => (<Partner key={peerConnection} peerConnection={peerConnection} styling={styling}></Partner>));
    };

    const makeCall = async (peerId) => {
        const peerConnection =  initializePeerConnection(peerId);
        const  tempPeerConections = peerConnections
        tempPeerConections[peerId] = peerConnection;
        setPeerConnections(tempPeerConections);
        setPeerConnectionArr((peerConnectionArr) => [...peerConnectionArr,peerConnection]);

        videoStream.current.getTracks().forEach(track => {
            peerConnections[peerId].addTrack(track, videoStream.current);
        });


        

        const offer = await peerConnections[peerId].createOffer();
        await peerConnections[peerId].setLocalDescription(offer);
        socket.emit('offer',{"id":peerId, "senderId":id, "offer":offer});
    }

    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

        const peerConnection = new RTCPeerConnection(configuration);

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
        setPeerConnectionArr((peerConnectionArr) => [...peerConnectionArr,peerConnection]);

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
        <div className="videoRoom">
            {renderUserVideo()}
            {renderPartnerVideo()}
        </div>
    );
}

export default Room;