/* Setting div-n specific actions for all div "pixels" is 
   computationally expensive. An alternative is calculating div-n and 
   working specifically with the desired div(s).
   As mouse events are unreliable, interpolating msX and msY is useful.
*/
let choice = '#0000FF';
let dotEnabled = false;
let brushSize = 5;

let active = false;
let startAgain = false;
let queueN = -1;
let n = 0;
let inQueue = false;
let writing = false;
let written = false;
let mX = [];
let mY = [];
let filledM = -1;
let divList = [];
let divListN = 0;
let checkedDivN = -1;

let mouseX;
let mouseY;

let nElemsOnYAxis = 200;
let divWidth;
let divHeight;
let minSide;
let nExistingElems = 0;

const sketchContainer = document.getElementById('sketchContainer');
const forgiveDiv = document.getElementById('forgiveDiv');

let skLeft = sketchContainer.getBoundingClientRect().left;
let skTop = sketchContainer.getBoundingClientRect().top;
const skWidth = 600;
const skHeight = 400;

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

function adder(divN, w, h){
  const newDiv = document.createElement('div');
  newDiv.setAttribute('id', `div-${divN}`);
  newDiv.setAttribute('class', 'all');
  newDiv.setAttribute('draggable', 'false');
  newDiv.style.width = `${w}px`;
  newDiv.style.height = `${h}px`;
  sketchContainer.appendChild(newDiv);
}

function remover(divN){
  const deleted = document.getElementById(`div-${divN}`);
  sketchContainer.removeChild(deleted);
}

function resizer(w, h){
  const toDo = document.querySelectorAll('.all');
  toDo.forEach(elem => {
    elem.style.width = `${w}px`;
    elem.style.width = `${h}px`;
  });
}

/* sizer() assumes square divs. To adjust for arbitrary nElemsOnYAxis, 
   the horizontal and vertical sides need separate calculation and 
   variables for use throughout sizer() and elsewhere in the script. As 
   nElemsOnYAxis will not be a user option, it can be selected for side 
   lengths that are mod=zero for both skWidth and skHeight. 
   Examples for 600 by 400:
   2, 4, 5, 10, 20, 40, 50
*/
function sizer(nElemsOnYAxis){
  const newDivHeight = skHeight / nElemsOnYAxis;
  let nElemsOnXAxis;

  // IF Math.floor allows a newDivWidth closest to newDivHeight:
  if(Math.abs(skWidth / (Math.floor((skWidth / skHeight) * 
     nElemsOnYAxis)) - newDivHeight) < 
     Math.abs(skWidth / Math.ceil((skWidth / skHeight) * 
     nElemsOnYAxis))){
    nElemsOnXAxis = (Math.floor((skWidth / skHeight) * 
                     nElemsOnYAxis))
  } else{
    nElemsOnXAxis = (Math.ceil((skWidth / skHeight) * 
                     nElemsOnYAxis))
  }
  
  const newDivWidth = skWidth / nElemsOnXAxis;
  const totalElems = nElemsOnYAxis * nElemsOnXAxis;

  minSide = Math.min(newDivWidth, newDivHeight);
  divWidth = newDivWidth;
  divHeight = newDivHeight;

  if(nExistingElems > totalElems){
    const last = totalElems;
    for(let i = nExistingElems - 1; i >= last; i--){
      remover(i);
    }
    // Resize elements bigger.
    resizer(newDivWidth, newDivHeight);
    nExistingElems = totalElems;

  } else if(nExistingElems < totalElems){
    // Resize elements smaller.
    resizer(newDivWidth, newDivHeight);
    for(let i = nExistingElems; i < totalElems; i++){
      adder(i, newDivWidth, newDivHeight);
    }
    nExistingElems = totalElems;
  }
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
    const m = queueN;
    let o;
    if(startAgain){
      o = m;
      startAgain = false;
    }
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
        console.log('queued');
      } else{ 
        writing = true;
        inQueue = false;

        // IF startAgain for this instance of setSkCoords():
        if(o === m){
          mX = [];
          mY = [];
          filledM = -1;
        }
        // Since nothing has been assigned to object key [-1], the
        // below will set oldX/oldY to undefined when array is empty.
        let  oldX = mX[mX.length - 1];
        let  oldY = mY[mY.length - 1];

        // undefined --> NaN which returns false for all comparisons.
        if(msX > oldX && msY > oldY){
          let nXSteps = (msX - oldX) / minSide;
          let nYSteps = (msY - oldY) / minSide;
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
          let nXSteps = (oldX - msX) / minSide;
          let nYSteps = (msY - oldY) / minSide;
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
          let nXSteps = (msX - oldX) / minSide;
          let nYSteps = (oldY - msY) / minSide;
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
          let nXSteps = (oldX - msX) / minSide;
          let nYSteps = (oldY - msY) / minSide;
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

  // console.log('checking collide');
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
     side is length of div "pixel" side.
    
     For center div:
     vertical = (y - skTop)
     rowNum = Math.floor(vertical / divHeight)
     firstDivN = rowNum * (skWidth / divWidth)
     
     horizontal = (x - skLeft)
     columnNum = Math.floor(horizontal / divWidth)
     
     For general case: divN = firstDivN + columnNum

     centerDivN = Math.floor((y - skTop) / divHeight) * (skWidth / 
                  divWidth) + Math.floor((x - skLeft) / divWidth)
  
     brushSize is always odd.
     To the left: 
     horizontal = (x - (brushSize - 1) / 2 - skLeft)
     firstBrushedColumn = Math.floor(horizontal / divWidth)
     To the right:
     horizontal = (x + (brushSize - 1) / 2 - skLeft)
     lastBrushedColumn = Math.floor(horizontal / divWidth)
     To the top:
     vertical = (y - (brushSize - 1) / 2 - skTop)
     firstBrushedRow = Math.floor(vertical / divHeight)
     To the bottom:
     vertical = (y + (brushSize - 1) / 2 - skTop)
     LastBrushedRow = Math.floor(vertical / divHeight)
     
     firstBrushedDivN = firstBrushedRow * (skWidth / divWidth) +
                        firstBrushedColumn
  **************************************************************/
  

function computeIDs(x, y){
  let firstBrushedRowN = Math.floor((y - (brushSize - 1) / 2 - skTop) / 
                         divHeight);
  let lastBrushedRowN = Math.floor((y + (brushSize - 1) / 2 - skTop) / 
                        divHeight);
  let firstBrushedColumnN = Math.floor((x - (brushSize - 1) / 2 - 
                            skLeft) / divWidth);
  let lastBrushedColumnN = Math.floor((x + (brushSize - 1) / 2 - 
                           skLeft) / divWidth);
  const rowMultiplier = skWidth / divWidth;
  
  // "No collision" case (actually allows edging right and bottom):
  if(x - (brushSize - 1) / 2 > skLeft &&
     skLeft + skWidth > x + (brushSize - 1) / 2 &&
     y - (brushSize - 1) / 2 > skTop &&
     skTop + skHeight > y + (brushSize - 1) / 2){

    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with bottom case:
  } else if(x - (brushSize - 1) / 2 > skLeft &&
            skLeft + skWidth > x + (brushSize - 1) / 2 &&
            skTop + skHeight <= y + (brushSize - 1) / 2){
    
    lastBrushedRowN = skHeight / divHeight - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with left case:
  } else if(x - (brushSize - 1) / 2 <= skLeft &&
            y - (brushSize - 1) / 2 > skTop &&
            skTop + skHeight > y + (brushSize - 1) / 2){
    
    firstBrushedColumnN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with right case:
  } else if(skLeft + skWidth <= x + (brushSize - 1) / 2 &&
            y - (brushSize - 1) / 2 > skTop &&
            skTop + skHeight > y + (brushSize - 1) / 2){

    lastBrushedColumnN = skWidth / divWidth - 1;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with top case:
  } else if(x - (brushSize - 1) / 2 > skLeft &&
            skLeft + skWidth > x + (brushSize - 1) / 2 &&
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
            skTop + skHeight <= y + (brushSize - 1) / 2){

    lastBrushedRowN = skHeight / divHeight - 1;
    firstBrushedColumnN = 0;
    for(let i = firstBrushedRowN; i <= lastBrushedRowN; i++){
      for(let j = firstBrushedColumnN; j <= lastBrushedColumnN; j++){
        divList[divListN] = `div-${i * rowMultiplier + j}`;
        divListN++;
      }
    }
  // Collide with bottom right corner case:
  } else if(skLeft + skWidth <= x + (brushSize - 1) / 2 &&
            skTop + skHeight <= y + (brushSize - 1) / 2){
    
    lastBrushedRowN = skHeight / divHeight - 1;
    lastBrushedColumnN = skWidth / divWidth - 1;
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
  } else if(skLeft + skWidth <= x + (brushSize - 1) / 2 &&
            y - (brushSize - 1) / 2 <= skTop){

    firstBrushedRowN = 0;
    lastBrushedColumnN = skWidth / divWidth - 1;
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
    const vLast = divList.length - 1;
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
  sketchContainer.addEventListener('mousedown', (e) => {
    active = true;
    startAgain = true;
    isHere();
    backfill();
    if(dotEnabled){
      computeIDs(e.clientX, e.clientY);
      written = true;
    }
  });
}

function stop(){
  forgiveDiv.addEventListener('mouseup', () => {
    active = false;
  });
}

function reset(){
  // Revert to stylesheet backgroundColor.
  const vLast = divList.length - 1;
  for(let i = 0; i <= vLast; i++){
    const div = document.getElementById(divList[i]);
    div.style.backgroundColor = '';
  }

  divList = [];
  divListN = 0;
  checkedDivN = -1
}

window.addEventListener('load', doStuff);

function doStuff(){
  sizer(nElemsOnYAxis);
  document.addEventListener('mousemove', setCoords);
  sketchContainer.addEventListener('mousemove', setSkCoords);
  start();
  stop();
  window.addEventListener('resize', debounce(() => {
    setXY();
   }));
  //styler();

}