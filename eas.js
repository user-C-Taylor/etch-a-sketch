/* use adder to add div, create name, + add reference to div to array. use for each to apply function to each array item.
      */
let nDivs = 0;
let active = false;
let mouseX;
let mouseY;
let mX = [];
let mY = [];
let filledM = -1;
let checkedM = -1;
let side;
let nExistingElems = 0;
let choice = '#0000FF';
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
    /* div0 div1 div2 div3 n=4
       t=2
       t- 1 = 1
    */
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

function doElementsCollide(msX, msY, elem){
    const elemDim = elem.getBoundingClientRect();

    return ((msX > elemDim.left) &&
            (msX < elemDim.right)) &&
           ((msY > elemDim.top) &&
            (msY < elemDim.bottom));
  }

function draw(){
  const here = doElementsCollide(mouseX, mouseY, forgiveDiv);

  /*
  const toDo = document.querySelectorAll('.all');
  toDo.forEach(elem => {
    if(doElementsCollide(elem)){
      elem.style.backgroundColor = choice;
    }
  });
  */
  console.log('checking collide');
  // IF here and mouseup hasn't fired yet.
  if(here && active){
    window.requestAnimationFrame(draw);
  } else if (!here){
    active = false;
  }
}

function start(){
  sketchContainer.addEventListener('mousedown', () => {
    active = true;
    draw();
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
  sizer(100);
  document.addEventListener('mousemove', setCoords);
  start();
  stop();
  styler();

}