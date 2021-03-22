import './room.css';
import {useState, useEffect, useRef} from 'react';
import {socket} from "../socket";
import Partner from "./partner";


function Room(props) {
    let id = "";
    const [peerConnections,setPeerConnections] = useState({});
    const [peerConnectionArr, setPeerConnectionArr] = useState([]);
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
        });
        socket.on("joinedRoom", (peersConnected) => {
            peersConnected.forEach( (peerID) => {
                makeCall(peerID);
            })
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
        //     console.log(peerConnection);
        //     console.log(peerConnections);
        //     let element = <p>Funker dette?</p>
        //     renderedvids.push(
        //         //<Partner key={peerConnection} peerConnection={peerConnections[peerConnection]} reRenderNumb={reRenderNumb}></Partner>
        //         element
        //     ); 
        // }

        // Object.entries(peerConnections).map(([index,peerConnection]) => {
        //     console.log("inni for");
        //     renderedvids.push(
        //         <Partner key={index} peerConnection={peerConnection} reRenderNumb={reRenderNumb}></Partner>
        //     );
        // });
        console.log(peerConnectionArr);

        return peerConnectionArr.map((peerConnection) => (<Partner key={peerConnection} peerConnection={peerConnection}></Partner>));
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
        <div className="p2p">
            {renderUserVideo()}
            <div>
                {renderPartnerVideo()}
            </div>
        </div>
    );
}

export default Room;