/* Setting div-n specific actions for all drawing divs is 
   computationally expensive. An alternative is calculating div-n and 
   working specifically with the desired div(s).
   As mouse events are unreliable, interpolating msX and msY is useful.
      */
let nDivs = 0;
let active = false;
let mouseX;
let mouseY;
let mX = [];
let mY = [];
let filledM = -1;
let checkedM = -1;
let nElemsOnSide = 400;
let side;
let nExistingElems = 0;
let choice = '#0000FF';
let queueN = -1;
let n = 0;
let inQueue = false;
let writing = false;
let written = false;
const sketchContainer = document.getElementById('sketchContainer');
const forgiveDiv = document.getElementById('forgiveDiv');

document.oncontextmenu = () => false;
function adder(divN, side){
  const newDiv = document.createElement('div');
  newDiv.setAttribute('id', `div-${divN}`);
  newDiv.setAttribute('class', 'all');
  newDiv.setAttribute('draggable', 'false');
  newDiv.style.width = `${side}px`;
  newDiv.style.height = `${side}px`;
  sketchContainer.appendChild(newDiv);
}
function remover(divN){
  const deleted = document.getElementById(`div-${divN}`);
  sketchContainer.removeChild(deleted);
}
function resizer(newDivSide){
  const toDo = document.querySelectorAll('.all');
  toDo.forEach(elem => {
    elem.style.width = `${newDivSide}px`;
    elem.style.width = `${newDivSide}px`;
  });
}
function sizer(nElemsOnSide){
  const totalElems = nElemsOnSide * nElemsOnSide;
  const newDivSide = 400 / nElemsOnSide;
  side = newDivSide;
  if(nExistingElems > totalElems){
    const last = totalElems;
    for(let i = nExistingElems - 1; i >= last; i--){
      remover(i);
    }
    //resize elements bigger
    resizer(newDivSide);
    nExistingElems = totalElems;

  } else if(nExistingElems < totalElems){
    // resize elements smaller
    resizer(newDivSide);
    for(let i = nExistingElems; i < totalElems; i++){
      adder(i, newDivSide);
    }
    nExistingElems = totalElems;
  }
}

function styler(){
  const toDo = document.querySelectorAll('.all');
  toDo.forEach(elem => {
    elem.addEventListener('mouseenter', () => {
      if(active){
        elem.style.backgroundColor = choice;
      }
    })
  });
}

function setCoords(e){
  e.stopPropagation();
  mouseX = e.clientX;
  mouseY = e.clientY;  
}

function setSkCoords(e){
  e.stopPropagation();
  queueN += 1;
  // Preserve queueN, msX, and msY specific to lexical context of 
  // mousemove event.
  m = queueN;
  let msX = e.clientX;
  let msY = e.clientY;
  // queueBackfill() must be declared within setSkCoords() lexical 
  // context to access m, msX, and msY when queue builds up.
  function queueBackfill(){

    if(m > n){
      setTimeout(() => {
        queueBackfill();
      }, 50);
      inQueue = true;
    } else{ 
      writing = true;
      inQueue = false;

      // Since nothing has been assigned to object key [-1], the below 
      // will set oldX/oldY to undefined when the array is empty.
      let  oldX = mX[mX.length - 1];
      let  oldY = mY[mY.length - 1];

      // undefined --> NaN which returns false for all comparisons.
      if(msX > oldX && msY > oldY){
        let nXSteps = (msX - oldX) / side;
        let nYSteps = (msY - oldY) / side;
        let stepsMax = Math.ceil(Math.max(nXSteps, nYSteps));
        let incrX = (msX - oldX) / stepsMax;
        let incrY =  (msY - oldY) / stepsMax;

        let last = filledM + stepsMax;
        for(let i = filledM + 1; i <= last; i++){
          mX[i] = mX[i-1] + incrX;
          mY[i] = mY[i-1] + incrY;
        }
        filledM += stepsMax;
      } else if(msX < oldX && msY > oldY){
        let nXSteps = (oldX - msX) / side;
        let nYSteps = (msY - oldY) / side;
        let stepsMax = Math.ceil(Math.max(nXSteps, nYSteps));
        let incrX = -(oldX - msX) / stepsMax;
        let incrY =  (msY - oldY) / stepsMax;

        let last = filledM + stepsMax;
        for(let i = filledM + 1; i <= last; i++){
          mX[i] = mX[i-1] + incrX;
          mY[i] = mY[i-1] + incrY;
        }
        filledM += stepsMax;
      } else if(msX > oldX && msY < oldY){
        let nXSteps = (msX - oldX) / side;
        let nYSteps = (oldY - msY) / side;
        let stepsMax = Math.ceil(Math.max(nXSteps, nYSteps));
        let incrX = (msX - oldX) / stepsMax;
        let incrY = -(oldY - msY) / stepsMax;

        let last = filledM + stepsMax;
        for(let i = filledM + 1; i <= last; i++){
          mX[i] = mX[i-1] + incrX;
          mY[i] = mY[i-1] + incrY;
        }
        filledM += stepsMax;
      } else if(msX < oldX && msY < oldY){
        let nXSteps = (oldX - msX) / side;
        let nYSteps = (oldY - msY) / side;
        let stepsMax = Math.ceil(Math.max(nXSteps, nYSteps));
        let incrX = -(oldX - msX) / stepsMax;
        let incrY = -(oldY - msY) / stepsMax;

        let last = filledM + stepsMax;
        for(let i = filledM + 1; i <= last; i++){
          mX[i] = mX[i-1] + incrX;
          mY[i] = mY[i-1] + incrY;
        }
        filledM += stepsMax;
      } else if(oldX === undefined){
        mX.push(msX);
        mY.push(msY);
        filledM += 1;
      }
      written = true;
      writing = false;
      n += 1;
    }
  }
  queueBackfill();
}

function doElementsCollide(msX, msY, elem){
    const elemDim = elem.getBoundingClientRect();

    return ((msX > elemDim.left) &&
            (msX < elemDim.right)) &&
          ((msY > elemDim.top) &&
            (msY < elemDim.bottom));
  }

function isHere(){
  const here = doElementsCollide(mouseX, mouseY, forgiveDiv);

  console.log('checking collide');
  // IF here and mouseup hasn't fired yet.
  if(here && active){
    window.requestAnimationFrame(isHere);
  }else if (!here){
    active = false;
  }
}

function computeIDs(){

}

function backfill(){

  if(written){
    written = false;
    let vLast = mX.length -1;


    checkedM = vLast;
  }

  if(active || inQueue || writing || written){
    window.requestAnimationFrame(backfill); 
  }
}

function start(){
  sketchContainer.addEventListener('mousedown', () => {
    active = true;
    isHere();
    //backfill();
  })
}

function stop(){
  forgiveDiv.addEventListener('mouseup', () => {
    active = false;
  })
}
function reset(){
  const toDo = document.querySelectorAll('.all');
  toDo.forEach(elem => {
    elem.style.backgroundColor = '#FFFFFF';
  });
}
window.addEventListener('load', doStuff);

function doStuff(){
  sizer(nElemsOnSide);
  document.addEventListener('mousemove', setCoords);
  sketchContainer.addEventListener('mousemove', setSkCoords);
  start();
  stop();
  //styler();

}