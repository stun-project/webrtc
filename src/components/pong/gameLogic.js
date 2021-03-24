var fart1 = 5;
var fart2 = 5;
var fartK = 1.5;

var hoyre = false;
var venstre = false;

var hoyre2 = false;
var venstre2 = false;

var taster = {left: 37, right: 39, speedUp: 38, speedDown: 40, left2: 65, right2: 68, speedUp2: 87, speedDown2: 83}

var xPos = 0;
var xPos2 = 620;

var xPosK = 690;
var yPosK = 590;

var retningX = true;
var retningY = false;

var poeng1 = 0;
var poeng2 = 0;

var tast = [];


function startGame(){
    const canvas = document.getElementById("tegneflate");
	const ctx = canvas.getContext("2d");
    document.onkeypress = function (evt) {
        keyPress(evt);
    }
	setInterval(() => {
        animasjon(ctx);
    },10);
}






function keyPress(evt){
    tast[evt.keyCode] = evt.type == 'keydown';

    venstre = false;
    hoyre = false;

    venstre2 = false;
    hoyre2 = false;

//1
    if(tast[37] === true)
    {
        venstre = true;
        høyre = false;
    }
    if(tast[39] === true)
    {
        hoyre = true;
        venstre = false;
    }
    
//2	
    if(tast[65] === true)
    {
        venstre2 = true;
        hoyre2 = false;
    }
    if(tast[68] === true)
    {
        hoyre2 = true;
        venstre2 = false;
    }
}






function animasjon(ctx) {

// styre x - retning
	if(hoyre == true){
		xPos +=fart1;
	}
	if(venstre == true){
		xPos -=fart1;
	}
//2	
	if(hoyre2 == true){
		xPos2 +=fart2;
	}
	if(venstre2 == true){
		xPos2 -=fart2;
	}

	
//maks og minimumsposisjon	
	if(xPos > 700){
		xPos = 0;
	}
	if(xPos < 0){
		xPos = 700;
	}
//2	
	if(xPos2 > 700){
		xPos2 = 0;
	}
	if(xPos2 < 0){
		xPos2 = 700;
	}

	
	
//Kule	
    if(yPosK < 600 && yPosK > 0){

        if(retningX == true){
            xPosK +=fartK;
        }
        if(retningX == false){
            xPosK -=fartK;
        }
    //styre y - retning
        if(retningY == true){
            yPosK +=fartK;
        }
        if(retningY == false){
            yPosK -=fartK;
        }
        
        
    //skifte x - retning
        if(xPosK > 690){
            retningX = false;
        }
        if(xPosK < 10){
            retningX = true;
        }
        
    //skifte y - retning
        if(yPosK < 30){
            if(xPosK > (xPos2 - 7) && xPosK < (xPos2 + 80)){
            retningY = true;
            fartK += 0.25;
            poeng1 += 1;
            }
        }
        
        if(yPosK > 570){
            if(xPosK > (xPos - 7) && xPosK < (xPos + 80))
            {
            retningY = false;
            fartK += 0.25;
            poeng2 += 1;
            }
        }

        drawGame(ctx);

    }
    else{
        playerLost(ctx);
    }
}


function drawGame(ctx){
    ctx.clearRect(0,0,700,600);
            
    //rektangel	
        ctx.beginPath();
        ctx.rect(xPos,590,70,5);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "blue";
        ctx.stroke();
    //rektangel	2
        ctx.beginPath();
        ctx.rect(xPos2,10,70,5);
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

function playerLost() {
    ctx.clearRect(0,0,700,600);
        
        
        ctx.font = "40px Arial";
        ctx.fillStyle = "green";
        ctx.fillText("Game Over",250,280);
        
        
    //vinneren er	
        if(poeng1 > poeng2){
        ctx.font = "25px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Vinneren er rød",260,320);
        }
        else if(poeng2 >= poeng1){
        ctx.font = "25px Arial";
        ctx.fillStyle = "blue";
        ctx.fillText("Vinneren er blå",260,320);
        }
}


