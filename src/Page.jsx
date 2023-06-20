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

  let textSize = 0.03

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