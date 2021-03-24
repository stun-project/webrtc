import './pong.css';
import {useState, useEffect, useRef} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");

function Pong() {
    let id = "";
    let peerConnection = {};
    let position = 0;
    let peerPosition = 0;
    let thisIsTheCaller;
    const [awaitingGame, setAwaitingGame] = useState(true);
    const canvas = useRef();
    

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
            return <canvas ref={canvas} id="gameScreen" width="700" height="600"/>
        }
    }


    async function makeCall(peerId) {
        console.log("Denne klienten ringer!!!!")
        thisIsTheCaller = true;
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
        thisIsTheCaller = false;
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
            peerPosition = event.data; //fikse så man kan sende andre ting?
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
        let gameVariables;
        if(thisIsTheCaller){
            gameVariables = [350,300,true,false,0.5];
        }else{
            gameVariables = [350,300,false,false,0.5];
        }
        const ctx = canvas.current.getContext("2d");
        document.onkeypress = function (evt) {
            keyPress(evt,chatChannel);
        }
        setInterval(() => {
            gameVariables = animasjon(ctx,gameVariables);
        },2);
    }

    const keyPress = (evt,chatChannel) => {
        console.log("Trykket på en knapp")
        const speed = 7;
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


    const animasjon = (ctx,gameVariables) => {
        //xPosK,yPosK,directionX,directionY,speedBullet
        if(position > 700){
            position = 0;
        }
        else if(position < 0){
            position = 700;
        }


        //Kule	
        if(gameVariables[1] < 600 && gameVariables[1] > 0){
            if(gameVariables[2] == true){
                gameVariables[1] += gameVariables[4];
            }
            if(gameVariables[2] == false){
                gameVariables[1] -= gameVariables[4];
            }

            //styre y - retning
            if(gameVariables[3] == true){
                gameVariables[0] += gameVariables[4];
            }
            if(gameVariables[3] == false){
                gameVariables[0] -= gameVariables[4];
            }
         
         
         
        //skifte x - retning
            if(gameVariables[0] > 690){
                gameVariables[2] = false;
            }
            if(gameVariables[0] < 10){
                gameVariables[2] = true;
            }
         
        //skifte y - retning
            if(gameVariables[1] < 30){
                if(gameVariables[0] > (peerPosition - 7) && gameVariables[0] < (peerPosition + 80)){
                    gameVariables[3] = true;
                    gameVariables[4] += 0.25;
                }
            }
         
            if(gameVariables[1] > 570){
                if(gameVariables[0] > (position - 7) && gameVariables[0] < (position + 80)){
                    gameVariables[3] = false;
                    gameVariables[4] += 0.25;
                }
            }
        }else if(gameVariables[1] >= 600){
            console.log("you lost the game!");
        }else if(gameVariables[1] > 0){
            console.log("opponent lost!")
        }
        
        drawGame(ctx, gameVariables[0], gameVariables[1]);
        return gameVariables
    }

    const drawGame = (ctx, xPosK, yPosK) => {
        ctx.clearRect(0,0,700,600);
                
        //rektangel	
        ctx.beginPath();
        ctx.rect(position,590,70,5);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "blue";
        ctx.stroke();
        //rektangel	2
        ctx.beginPath();
        ctx.rect(peerPosition,10,70,5);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "red";
        ctx.stroke();	
        
        //Kule	
        ctx.beginPath();
        ctx.arc(xPosK, yPosK, 20, 0, 2 * Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "green";
        ctx.stroke();            
    }


    



    return (
        <div className="pong">
            {renderScreen()}
        </div>
    );
}

export default Pong;