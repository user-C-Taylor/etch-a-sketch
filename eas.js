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
let divList = [];
let divListN = 0;
let checkedDivN = -1;
let nElemsOnSide = 200;
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
let skLeft = sketchContainer.getBoundingClientRect().left;
let skTop = sketchContainer.getBoundingClientRect().top;

function setXY(){
  skLeft = sketchContainer.getBoundingClientRect().left;
  skTop = sketchContainer.getBoundingClientRect().top;
}

function debounce(func, milliseconds){
  let time = milliseconds || 100; 
  let timer;
  return function(){
      if(timer) clearTimeout(timer);
      timer = setTimeout(func, time);
  };
}

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
    // Resize elements bigger.
    resizer(newDivSide);
    nExistingElems = totalElems;

  } else if(nExistingElems < totalElems){
    // Resize elements smaller.
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
  if(active){
    e.stopPropagation();
    queueN += 1;
    // Preserve queueN, msX, and msY specific to lexical context of 
    // setSkCoords() instance.
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

        // Since nothing has been assigned to object key [-1], the
        // below will set oldX/oldY to undefined when array is empty.
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
            computeIDs(mX[i], mY[i]);
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
            computeIDs(mX[i], mY[i]);
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
            computeIDs(mX[i], mY[i]);
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
            computeIDs(mX[i], mY[i]);
          }
          filledM += stepsMax;
        } else if(oldX === undefined){
          mX.push(msX);
          mY.push(msY);
          computeIDs(msX, msY);
          filledM += 1;
        }
        written = true;
        writing = false;
        n += 1;
      }
    }
    queueBackfill();
  }
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


  /**************************************************************
     MATH FOR computeIDs():
     
     For sketchContainer and div-0:
     The top is the same top and the left is the same left.
     For sketchContainer and the bottom right div-n:
     The bottom is the same bottom and the right is the same right.

     First row is row 0; first column is column 0;
    
     For center div:
     vertical = (y - skTop)
     rowNum = Math.floor(vertical / side)
     firstDivN = rowNum * (400 / side)
     
     horizontal = (x - skLeft)
     columnNum = Math.floor(horizontal / side)
     
     For general case: divN = firstDivN + columnNum

     centerDivN = Math.floor((y - skTop) / side) * (400 / side) +
                  Math.floor((x - skLeft) / side)
  
     BrushSize is always odd.
     To the left: 
     horizontal = (x - (brushSize - 1) / 2 - skLeft)
     firstBrushedColumn = Math.floor(horizontal / side)
     To the right:
     horizontal = (x + (brushSize - 1) / 2 - skLeft)
     lastBrushedColumn = Math.floor(horizontal / side)
     To the top:
     vertical = (y - (brushSize - 1) / 2 - skTop)
     firstBrushedRow = Math.floor(vertical / side)
     To the bottom:
     vertical = (y + (brushSie - 1) / 2 - skTop)
     LastBrushedRow = Math.floor(vertical / side)
     
     firstBrushedDivN = firstBrushedRow * (400 / side) +
                        firstBrushedColumn
  **************************************************************/
  

function computeIDs(x, y){
  let brushSize = 3;
  let firstBrushedRowN = Math.floor((y - (brushSize - 1) / 2 - skTop) / 
                         side);
  let lastBrushedRowN = Math.floor((y + (brushSize - 1) / 2 - skTop) / 
                        side);
  let firstBrushedColumnN = Math.floor((x - (brushSize - 1) / 2 - 
                            skLeft) / side);
  let lastBrushedColumnN = Math.floor((x + (brushSize - 1) / 2 - 
                           skLeft) / side);
  const rowMultiplier = 400 / side;
  
  // "No collision" case (actually allows edging right and bottom):
  if(x - (brushSize - 1) / 2 > skLeft &&
     skLeft + 400 > x + (brushSize - 1) / 2 &&
     y - (brushSize - 1) / 2 > skTop &&
     skTop + 400 > y + (brushSize - 1) / 2){

    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with bottom case:
  } else if(x - (brushSize - 1) / 2 > skLeft &&
            skLeft + 400 > x + (brushSize - 1) / 2 &&
            skTop + 400 <= y + (brushSize - 1) / 2){
    
    lastBrushedRowN = 400 / side - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with left case:
  } else if(x - (brushSize - 1) / 2 <= skLeft &&
            y - (brushSize - 1) / 2 > skTop &&
            skTop + 400 > y + (brushSize - 1) / 2){
    
    firstBrushedColumnN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with right case:
  } else if(skLeft + 400 <= x + (brushSize - 1) / 2 &&
            y - (brushSize - 1) / 2 > skTop &&
            skTop + 400 > y + (brushSize - 1) / 2){

    lastBrushedColumnN = 400 / side - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with top case:
  } else if(x - (brushSize - 1) / 2 > skLeft &&
            skLeft + 400 > x + (brushSize - 1) / 2 &&
            y - (brushSize - 1) / 2 <= skTop){
    
    firstBrushedRowN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with bottom left corner case:
  } else if(x - (brushSize - 1) / 2 <= skLeft &&
            skTop + 400 <= y + (brushSize - 1) / 2){

    lastBrushedRowN = 400 / side - 1;
    firstBrushedColumnN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with bottom right corner case:
  } else if(skLeft + 400 <= x + (brushSize - 1) / 2 &&
            skTop + 400 <= y + (brushSize - 1) / 2){
    
    lastBrushedRowN = 400 / side - 1;
    lastBrushedColumnN = 400 / side - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with top left corner case:
  } else if(x - (brushSize - 1) / 2 <= skLeft &&
            y - (brushSize - 1) / 2 <= skTop){

    firstBrushedRowN = 0;
    firstBrushedColumnN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with top right corner case:
  } else if(skLeft + 400 <= x + (brushSize - 1) / 2 &&
            y - (brushSize - 1) / 2 <= skTop){

    firstBrushedRowN = 0;
    lastBrushedColumnN = 400 / side - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  }
}

function backfill(){

  if(written){
    written = false;
    let vLast = divList.length - 1;
    for(let i = checkedDivN + 1; i <= vLast; i++){
      const div = document.getElementById(divList[i]);
      div.style.backgroundColor = choice;
    }
    checkedDivN = vLast;
  }

  if(active || inQueue || writing || written){
    window.requestAnimationFrame(backfill); 
  }
}

function start(){
  sketchContainer.addEventListener('mousedown', () => {
    active = true;
    isHere();
    backfill();
  })
}

function stop(){
  forgiveDiv.addEventListener('mouseup', () => {
    active = false;

    setTimeout(() => {
      mX = [];
      mY = [];
      filledM = -1;
      divList = [];
      divListN = 0;
      checkedDivN = -1;
    }, 200);
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
  window.addEventListener('resize', debounce(() => {
    setXY();
   }));
  //styler();

}