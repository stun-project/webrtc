import './pong.css';
import {useState, useEffect} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");

function Pong() {
    let id = "";
    let peerConnection = {};
    let position = 0;
    let peerPosition = 0;
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
        dataTransmission(chatChannel);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
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

        peerConnection.ondatachannel = (event) => {
            if (event.channel.label == 'chat') {
                dataTransmission(event.channel);
            }
        };
        
        if (message.offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', {senderId:id,id:message.senderId,answer:answer});
            
        }   
    }

    const dataTransmission = (chatChannel) => {
        console.log("dataTransmission har kjørt")
        chatChannel.onmessage = (event) => {
            console.log('onmessage:', event.data);
            peerPosition = event.data;
        }
        chatChannel.onopen = () => {
            console.log('onopen')
            initialize(chatChannel);
            //chatChannel.send("hola senorita");
        };
        chatChannel.onclose = () => {
            console.log('onclose');
            //Skifte addressen?
        }
    }

    const initialize = (chatChannel) => {
        console.log("init kjørt")
        // const canvas = document.getElementById("tegneflate");
        // const ctx = canvas.getContext("2d");
        document.onkeypress = function (evt) {
            keyPress(evt,chatChannel);
        }
        setInterval(() => {
            //animasjon(ctx);
        },10);
    }

    const keyPress = (evt,chatChannel) => {
        console.log("Trykket på en knapp")
        const speed = 3;
        switch(evt.code){
            case 'KeyA' || 'ArrowLeft':
                position -= speed;
                break;
            case 'KeyD' || 'ArrowRight':
                position += speed;
                break;
        }
        chatChannel.send(position);
    }


    const animasjon = (ctx) => {
        // if(position > 700){
        //     position = 0;
        // }
        // if(position < 0){
        //     position = 700;
        // }

        // //Kule	
        // if(yPosK < 600 && yPosK > 0){

        //     if(retningX == true){
        //         xPosK +=fartK;
        //     }
        //     if(retningX == false){
        //         xPosK -=fartK;
        //     }
        // //styre y - retning
        //     if(retningY == true){
        //         yPosK +=fartK;
        //     }
        //     if(retningY == false){
        //         yPosK -=fartK;
        //     }
            
            
        // //skifte x - retning
        //     if(xPosK > 690){
        //         retningX = false;
        //     }
        //     if(xPosK < 10){
        //         retningX = true;
        //     }
            
        // //skifte y - retning
        //     if(yPosK < 30){
        //         if(xPosK > (xPos2 - 7) && xPosK < (xPos2 + 80)){
        //         retningY = true;
        //         fartK += 0.25;
        //         poeng1 += 1;
        //         }
        //     }
            
        //     if(yPosK > 570){
        //         if(xPosK > (xPos - 7) && xPosK < (xPos + 80))
        //         {
        //         retningY = false;
        //         fartK += 0.25;
        //         poeng2 += 1;
        //         }
        //     }
        // }else{
        //     console.log("lost game")
        // }

    }


    



    return (
        <div className="pong">
            {renderScreen()}
        </div>
    );
}

export default Pong;