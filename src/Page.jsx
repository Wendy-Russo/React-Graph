import React from "react";
import { Vector3, HemisphericLight, MeshBuilder, StandardMaterial, ArcRotateCamera, VertexBuffer, AxesViewer, Color3, DynamicTexture, Color4, Vector2, Axis } from "@babylonjs/core";
import SceneComponent from 'babylonjs-hook';
import "./App.css";

let graphOffset = 0;
let plane;
let frontFaces = [];
let rightFaces = [];
let leftFaces = [];
let backFaces = [];
let noCull = [];

let minimumPoint = 999999;
let maximumPoint = -999999;
let camera;
let pointsX = 128;
let scale = 0.5;

window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

const distance2D = (x0,y0,x1,y1) => {
  return Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2))
}

const remap = (value,low1,high1,low2,high2) => {
  return(minMax(low2,high2,low2 + (value - low1) * (high2 - low2) / (high1 - low1),))
}

const createFakeData = (resolution) => {

  const FAKE_DATA = []

  for(let i = 0 ; i < resolution; i++){
    FAKE_DATA[i] = [];
    for(let j = 0 ; j < resolution; j++){
      FAKE_DATA[i][j] = Math.sin(distance2D(i,j,pointsX/2,pointsX/2)/pointsX*6 + (Math.PI * 0.5) + graphOffset ) * 20
    }
  }
  return FAKE_DATA;
}

let data = createFakeData(pointsX)

const addText = (text,size,resolution,position) => {

  //Setup and Position
  let plane = MeshBuilder.CreatePlane("text", {width: size*50, height : size});
  plane.position = position
  plane.billboardMode = 2;

  //Create dynamic texture
	var textureGround = new DynamicTexture("dynamic texture", {width:resolution*50, height:resolution});   
	
  //Create a flat material
	var materialGround = new StandardMaterial("Mat");    				
	materialGround.diffuseTexture = textureGround;
  materialGround.diffuseTexture.hasAlpha = true;
  materialGround.backFaceCulling = false;
  materialGround.specularColor = Color3.Black()
	plane.material = materialGround;


  //Add text to dynamic texture
  textureGround.drawText(text, null, null, `${Math.round(resolution)}px regular`, "white","", true, true);
  textureGround.getContext().textAlign = "center"
  plane.color = Color3.White()

  return plane
}

const addLine = (start,direction) => {
  const myPoints = [
    start,
    new Vector3(start.x+direction.x,start.y+direction.y,start.z+direction.z)
  ]

  return MeshBuilder.CreateLines("lines", {points: myPoints});
}

const updateGraph = (graphMesh,data = false) => {
  let positions = graphMesh.getVerticesData(VertexBuffer.PositionKind);
  let localMinimum = 999999, localMaximum = -999999;
  // Get the local Minimum and Maximum
  for(let i = 0 ; i < data.length; i++){
    for(let j = 0 ; j < data.length; j++){
      let thisPoint = data[i][j];

      if(thisPoint < localMinimum){
        localMinimum = thisPoint;
      }

      else if (thisPoint > localMaximum){
        localMaximum = thisPoint;
      }

    }
  }

  minimumPoint = localMinimum;
  maximumPoint = localMaximum;

  //move the graph points and scale it
  for(let i = 0 ; i < positions.length; i+=3){
    let x = positions[i];
    let y = positions[i+1];
    let z = positions[i+2];

    const X_ID = Math.round(remap(x,-1,1,0,pointsX-1))
    const Y_ID = Math.round(remap(z,-1,1,0,pointsX-1))

    const ELEVATION = data ? data[X_ID][Y_ID] : Math.sin((x+y)*10)/10
    positions[i+1] = remap(ELEVATION,minimumPoint,maximumPoint,-scale,scale)
    //positions[i+1] = Math.random()
    //positions[i] = Math.random()
  }


  graphMesh.updateVerticesData(VertexBuffer.PositionKind, positions);
}

const minMax = (min,max,val) => {
  return (Math.min(max,Math.max(min,val)))
}

const updateColor = (graphMesh) => {
  let colors  = new Array( pointsX * pointsX *pointsX ).fill(1) //= graphMesh.getVerticesData(VertexBuffer.ColorKind);
  let positions = graphMesh.getVerticesData(VertexBuffer.PositionKind);

  for(let i = 0 ; i < colors.length; i+=4){

    const HEIGHT = positions[(i*3/4)+1]


    let colorR = HEIGHT < 0 ? Math.abs(HEIGHT/scale) : 0

    let colorG = HEIGHT > 0 ? Math.abs(HEIGHT/scale) : 0

    let colorB = 1-Math.abs(HEIGHT/scale)

    colors[i] =  colorR
    colors[i+1] = colorG //colorG
    colors[i+2] = colorB //colorB
  }
  

  graphMesh.setVerticesData(VertexBuffer.ColorKind, colors);
}

const applyMaterials = (graphMesh) => {
  let stdMaterial = new StandardMaterial("stdMaterial");
  graphMesh.material = stdMaterial
  stdMaterial.specularColor = Color3.Black()
  stdMaterial.backFaceCulling = false
  //stdMaterial.wireframe = true;
}

const drawGrid = (centerPos,direction,width,height,resX,resY) => {
  let lines = []

  for(let i = 0 ; i < resY; i++){
    let increment = height / (resY-1);

    let startPos = new Vector3(centerPos.x - (width*0.5),centerPos.y-(height*0.5) + (increment * i),centerPos.z);

    lines.push(addLine(startPos,new Vector3(width,0,0)))
  }

  for(let i = 0 ; i < resX; i++){

    let increment = width / (resX-1);

    const startPos = new Vector3(centerPos.x - (width*0.5) + (increment * i),centerPos.y-(height*0.5),centerPos.z)
    lines.push(addLine(startPos, new Vector3(0,height,0)))
  }

  for(let i = 0 ; i < lines.length; i++){
    let line = lines[i];
    line.rotateAround(centerPos,Axis.X,direction.x/180*Math.PI);
    line.rotateAround(centerPos,Axis.Y,direction.y/180*Math.PI);
    line.rotateAround(centerPos,Axis.Z,direction.z/180*Math.PI);
    line.color = Color3.Black();
    line.alpha = 0.5
  }

  return lines;
}

const drawLegend = (centerPos,direction,width,minimum,maximum,resX,margin,textSize) => {
  let lines = []

  for(let i = 0 ; i < resX; i++){

    let increment = width / (resX-1);
    let textIncrement = Math.round(remap(i,0,resX-1,minimum,maximum)*10)/10;

    const startPos = new Vector3(centerPos.x - (width*0.5) + (increment * i),centerPos.y,centerPos.z)

    if(i === 0){
      lines.push(addText(textIncrement,textSize,128, new Vector3(startPos.x+(margin),startPos.y,startPos.z))) // BOTTOM TEXT
    }
    else if(i < resX-1){
      lines.push(addText(textIncrement,textSize,128, startPos)) // BOTTOM TEXT
    }
    else if(i === resX-1){
      lines.push(addText(textIncrement,textSize,128, new Vector3(startPos.x-(margin),startPos.y,startPos.z))) // BOTTOM TEXT
    }

  }

  for(let i = 0 ; i < lines.length; i++){
    let line = lines[i];
    line.rotateAround(centerPos,Axis.X,direction.x/180*Math.PI);
    line.rotateAround(centerPos,Axis.Y,direction.y/180*Math.PI);
    line.rotateAround(centerPos,Axis.Z,direction.z/180*Math.PI);
    line.rotation = Vector3.Zero()
  }

  return lines;
}

const updateLegend = () => {
  let textSize = 0.03
  if(window.mobileCheck()){
    textSize = 0.1
  }

  frontFaces.forEach((elem) => {elem.dispose()})
  rightFaces.forEach((elem) => {elem.dispose()})
  leftFaces.forEach((elem) => {elem.dispose()})
  backFaces.forEach((elem) => {elem.dispose()})
  noCull.forEach((elem) => {elem.dispose()})

  frontFaces = [];
  backFaces = [];
  rightFaces = [];
  leftFaces = [];
  noCull = [];
  // create the lines

  frontFaces = drawGrid(new Vector3(0,0,-1),new Vector3(0,0,0),2,scale*2,5,5);
  backFaces = drawGrid(new Vector3(0,0,1),new Vector3(0,0,0),2,scale*2,5,5);
  leftFaces = drawGrid(new Vector3(-1,0,0),new Vector3(0,90,0),2,scale*2,5,5);
  rightFaces = drawGrid(new Vector3(1,0,0),new Vector3(0,90,0),2,scale*2,5,5)
  drawGrid(new Vector3(0,-scale,0),new Vector3(90,0,0),2,2,5,5) // floor grid

  

  //add the horizontal text

  frontFaces = frontFaces.concat(drawLegend(new Vector3(0,scale+0.025,-1) , new Vector3(0,0,0) , 2 , 0 , pointsX , 5 , textSize*1.5,textSize))
  backFaces = backFaces.concat(drawLegend(new Vector3(0,scale+0.025,1) , new Vector3(0,0,0) , 2 , 0 , pointsX , 5 , textSize*1.5,textSize))
  leftFaces = leftFaces.concat(drawLegend(new Vector3(-1,scale+0.025,0) , new Vector3(0,-90,0) , 2 , 0 , pointsX , 5 , textSize*1.5,textSize))
  rightFaces = rightFaces.concat(drawLegend(new Vector3(1,scale+0.025,0) , new Vector3(0,-90,0) , 2 , 0 , pointsX , 5 , textSize*1.5,textSize))

  //add the bottom text (doesn't cull)

  noCull = noCull.concat(drawLegend(new Vector3(0,-scale-0.025,-1),new Vector3(0,0,0),2 , 0 , pointsX , 5,textSize*1.5,textSize));
  noCull = noCull.concat(drawLegend(new Vector3(0,-scale-0.025,1),new Vector3(0,0,0),2 , 0 , pointsX , 5,textSize*1.5,textSize));
  noCull = noCull.concat(drawLegend(new Vector3(-1,-scale-0.025,0),new Vector3(0,-90,0),2 , 0 , pointsX , 5,textSize*1.5,textSize));
  noCull = noCull.concat(drawLegend(new Vector3(1,-scale-0.025,0),new Vector3(0,-90,0),2 , 0 , pointsX , 5,textSize*1.5,textSize));
  
  // add the vertical text (duplicates for propper culling)
  frontFaces = frontFaces.concat(drawLegend(new Vector3(-1,0,-1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))
  leftFaces = leftFaces.concat(drawLegend(new Vector3(-1,0,-1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))

  frontFaces = frontFaces.concat(drawLegend(new Vector3(1,0,-1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))
  rightFaces = rightFaces.concat(drawLegend(new Vector3(1,0,-1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))

  leftFaces = leftFaces.concat(drawLegend(new Vector3(-1,0,1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))
  backFaces = backFaces.concat(drawLegend(new Vector3(-1,0,1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))

  rightFaces = rightFaces.concat(drawLegend(new Vector3(1,0,1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))
  backFaces = backFaces.concat(drawLegend(new Vector3(1,0,1),new Vector3(0,0,90),scale*2 , minimumPoint, maximumPoint , 5,textSize*0.5,textSize))
}

const onSceneReady = (scene) => {
  // This creates and positions a free camera (non-mesh)
  plane = MeshBuilder.CreateTiledGround("tiled ground",{xmin : -1 , xmax : 1 ,subdivisions : {w: pointsX-1, h: pointsX-1},updatable:true},scene)

  camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new Vector3(0, 0, 0), scene);
  camera.wheelPrecision = 30
  camera.lowerRadiusLimit = 15
  camera.upperRadiusLimit = 1000
  camera.fov = 0.1


  // This targets the camera to scene origin
  camera.lockedTarget = plane;

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  plane.useVertexColors = true;
  
  applyMaterials(plane)

  updateGraph(plane,data)
  
  updateColor(plane)

  updateLegend()

};


const onRender = (scene) => {

  let frontDot = Vector3.Dot(camera.getForwardRay().direction, Vector3.Forward())
  let rightDot = Vector3.Dot(camera.getForwardRay().direction, Vector3.Left())
  let leftDot = Vector3.Dot(camera.getForwardRay().direction, Vector3.Right())
  let backDot = Vector3.Dot(camera.getForwardRay().direction, Vector3.Backward())
  let limit = 0.1 ;

  let isFacingForward = (frontDot >= limit);
  let isFacingRight = (rightDot >= limit);
  let isFacingLeft = (leftDot >= limit);
  let isFacingBack = (backDot >= limit);

  frontFaces.forEach((elem) => {elem.isVisible = true})
  rightFaces.forEach((elem) => {elem.isVisible = true})
  leftFaces.forEach((elem) => {elem.isVisible = true})
  backFaces.forEach((elem) => {elem.isVisible = true})

  if(isFacingForward){
    frontFaces.forEach(elem => {(elem.isVisible = false)})
  }
  if(isFacingRight){
    rightFaces.forEach(elem => {(elem.isVisible = false)})
  }
  if(isFacingLeft){
    leftFaces.forEach(elem => {(elem.isVisible = false)})
  }
  if(isFacingBack){
    backFaces.forEach(elem => {(elem.isVisible = false)})
  }

  graphOffset += 0.005;
  
  updateGraph(plane,createFakeData(pointsX))
};


export default () => (
  <div>
    <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
  </div>
);