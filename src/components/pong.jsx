import './pong.css';
import {useState, useEffect, useRef} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");

function Pong(props) {
    let id = "";
    let peerConnection = {};
    // const [connected, setConnected] = useState(false);
    // const [receivingCall, setReceivingCall] = useState(false);
    // const peerRef = useRef();
    // const partnerVideoRef = useRef();
    // const videoStream = useRef();

    //Mine:
    const [awaitingGame, setAwaitingGame] = useState(true);
    

    useEffect(() => {
        initializeSocket();
        //initializeVideo();
        //Initialisere spillogikk??
    },[]);

    const initializeSocket = () => {       

        

        socket.emit("awaitingGame");

        socket.on("you", (myId) => {
            id = myId;
        });

        socket.on("gamePartnerId", (partnerId) => {
            //sende ut et offer?
            //her har den mottatt en partner
            setAwaitingGame(false);
            makeCall(partnerId);
        });

        socket.on("waitForPartner", () => {
            //printe venteskjerm??
            console.log("venter!");
            setAwaitingGame(true);
        });
        
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
        
        socket.on("gameOffer", async (message) => {
            setAwaitingGame(false);
            await receiveCall(message);
        });
        
        socket.on('answer', async message => {
            if (message.answer) {
                console.log(peerConnection);
                const remoteDesc = new RTCSessionDescription(message.answer);
                await peerConnection.setRemoteDescription(remoteDesc);
            }
        });
    };

    function renderScreen(){
        if(awaitingGame){
            return <p>waiting for a partner</p>
        }
        else{
            return <canvas id="gameScreen" width="700" height="600"/>
        }
    }


    async function makeCall(peerId) {
        console.log("Denne klienten ringer!!!!")
        initializePeerConnection(peerId);
              
        const chatChannel = peerConnection.createDataChannel('chat');
        chatChannel.onmessage = (event) => console.log('onmessage:', event.data);
        chatChannel.onopen = () => {
            console.log('onopen')
            chatChannel.send("hola senorita");
            console.log(peerConnection)
        };
        chatChannel.onclose = () => console.log('onclose');

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("sendt offer:")
        socket.emit('gameOffer',{"id":peerId, "senderId":id, "offer":offer});
    }



    const initializePeerConnection = (peerId) => {
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', {'id': peerId, "senderId":id, 'candidate': event.candidate});
            }
        };
    }
    


    const receiveCall = async (message) => {
        console.log("Denne klienten mottar!!")
        initializePeerConnection(message.senderId);
        
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
        
        if (message.offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));

            console.log("Kommet til if inne receiveCall");

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log(message.senderId);
            socket.emit('answer', {senderId:id,id:message.senderId,answer:answer});
            
        }   
    }

    return (
        <div className="pong">
            {/* {renderUserVideo()}
            {renderPartnerVideo()}
            <aside>
                {renderPeers()}
            </aside> */}
            {renderScreen()}
        </div>
    );
}

export default Pong;