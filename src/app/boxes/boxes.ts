import * as THREE from 'three';
import "../three-display/enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/DragControls"

import {ThreeBSP} from "./ThreeCSG";
import {Vector3} from "three";
import * as dat from 'dat.gui/build/dat.gui.js';
import {DragControls} from "./DragControls";

export interface ThreeDisplay {
  glRenderer: THREE.WebGLRenderer;
  cssRenderer: THREE.CSS3DRenderer;
  glScene: THREE.Scene;
  cssScene: THREE.Scene;
  camera: THREE.Camera;
  orbitControls: any;
  dragControls: DragControls;
  ctxCanvas2D: CanvasRenderingContext2D;
  render: ()=>void;
  labelUpdates:Label[];
  clickable:any[];
  toolTipRender:Element;
  toolTips:[]
}

const U_SIZE=44.45;

export class Box {
      o:any;                     // user data
      box: THREE.Mesh;           // the main mesh of this thing
      group = new THREE.Group(); // grouping of everything
      label:string;
      kind:string;
      labels:Label[] = [];
      rotation = new THREE.Vector3(0,0,0); // placeholder to keep track of total rotations
      specs:ObjectSpecs;
      isRoot:boolean = false;
      children:Box[]= [];
      gui:dat.GUI=null;
      isRackable=false;
      showLabels=false;
      canBeMoved=false;
      dragControls:any=null;
  constructor(public display:ThreeDisplay, public id:number,  isRoot:boolean) {
      this.isRoot=isRoot!=undefined?isRoot:false;
      this.group.userData=this;
      if (this.isRoot){
          this.display.glScene.add(this.group)
      }
  }
  boxMoved() {
    this.labels.forEach(l => {l.boxMoved()})
    this.children.forEach(c=>c.boxMoved())
    this.display.render()
  }
  addObject(o:Box){
    this.group.add(o.group);
    this.children.push(o);
  }
  rotateY(angle){
    this.rotation.add(new THREE.Vector3(0,angle,0))
    this.group.rotateY((angle*Math.PI)/180);
    this.boxMoved();
  }

  setHighlight = () => {
    let x = this.box.material as THREE.MeshBasicMaterial;
    x.color.set("#f4eb42");
    this.box.children.forEach(c=>{
      let x=(c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      x.color.set("#f4eb42");
    })
  }

  clearHighlight = () => {
    let x = this.box.material as THREE.MeshBasicMaterial;
    x.color.set(this.specs.color as string);
     this.box.children.forEach(c=> {
       let x = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
       x.color.set(this.specs.color as string);
     });
  }
  buildLabels(){}
  destroyLabels = () => {
    this.labels.forEach(l=>{l.destroy()})
    this.labels=[]
  }
  toggleLabels = () =>{
    if(this.showLabels){
      this.buildLabels()
    }else{ this.destroyLabels()}
    this.display.render()
  }

  toggleMoves = () =>{
    if(this.canBeMoved){
      this.display.dragControls.addObject(this.box)
    }else{
      this.display.dragControls.delObject(this.box)
    }
  }
  dragStart(){
  }
  dragEnd(){
  }
  drag(e){
  }
  constrainMoves(o:Box,v:THREE.Vector3){
  }
}


class ObjectSpecs {
  color:THREE.Color | string;
  width:number;
  height:number;
  depth:number;
  rotationY:number;
  position : THREE.Vector3;
  constructor(o){
    if('color' in o){this.color=o.color}
    if('width' in o){this.width=o.width}
    if('height' in o){this.height=o.height}
    if('depth' in o){this.depth=o.depth}
    if('rotationY' in o){this.rotationY=o.rotationY}
    if('position' in o){
      let pos=o.position;
      if('x' in pos&&'y' in pos&&'z'in pos){
        this.position=new THREE.Vector3(pos.x,pos.y,pos.z)
      }}
  }
}

const defaultRackSpecs ={
    u_height: 42,
    rails: {spaceOnLeft:100,depthFromFront:100,bottomSpace:200,
      depthFromBack:200, topSpace:200
    },
    width: 483 + 200,
    depth: 1000,
    height: 100+42*U_SIZE+100, // bottom+u_sizes+topspace
    color: "#9ad2f5",
    position: {x:0,y:0,z:0},
    rotationY: 0,
};
class Rails {
  constructor(public spaceOnLeft:number, // how much space between frontRail and left side of cab
              public depthFromFront:number, // how much space between frontRail and right side of cab
              public bottomSpace:number, // how much space between frontRail and bottom of cab
              public depthFromBack:number, // how much space between back rail and back of cab
              public topSpace:number // how much space between back rails top of cab
              )
  {}
}

class RackSpecs extends ObjectSpecs {
  rails: Rails;
  u_height:number;
  constructor(o){
    super(o);
    this.u_height=o.u_height;
    this.rails=new Rails(o.rails.spaceOnLeft,o.rails.depthFromFront,
                  o.rails.bottomSpace,o.rails.depthFromBack, o.rails.topSpace)
  }
}
const RAIL_WIDTH=30;
export class Rack extends Box {
  specs:RackSpecs;
  showRailLabels=false;
  pduCnt=0;
  constructor(display:ThreeDisplay,id:number, label:string, o?:any, isRoot?:boolean){
    super(display,id,isRoot);
    this.kind='rack';
    this.label=label;
    this.showLabels=true;
    if(o!=undefined){this.specs=new RackSpecs(o)}
    else{ this.specs=new RackSpecs(defaultRackSpecs)}
    this.specs.height= this.specs.rails.bottomSpace+this.specs.u_height*44.45+this.specs.rails.topSpace;
    this.buildShell()
    this.buildRails()
    this.buildLabels()
    if(this.showRailLabels){this.buildRailLabels()}
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
    this.rotateY(this.specs.rotationY)
  }
  buildShell(){
     let outter = new THREE.BoxGeometry(this.specs.width, this.specs.height, this.specs.depth, 1, 1, 1)
     let inner = new THREE.BoxGeometry(this.specs.width-3, this.specs.height-3, this.specs.depth, 1, 1, 1)
     let outcsg= new ThreeBSP(outter);
     let incsg = new ThreeBSP(inner);
     let r=outcsg.subtract(incsg)
     let geometry=r.toGeometry(r);
     this.box = new THREE.Mesh(geometry,
       new THREE.MeshLambertMaterial( {color: this.specs.color, wireframe:false }));
  }

  buildRails() {
    this.box.geometry.computeBoundingBox();
    let front_rail = new THREE.Vector3(
      this.box.geometry.boundingBox.min.x + this.specs.rails.spaceOnLeft+RAIL_WIDTH/2,
      this.box.geometry.boundingBox.min.y + this.specs.rails.bottomSpace,
      this.box.geometry.boundingBox.max.z - this.specs.rails.depthFromFront);
    let front_rail2 = new THREE.Vector3(
      this.box.geometry.boundingBox.min.x + this.specs.rails.spaceOnLeft+RAIL_WIDTH/2+483, //19" in mm
      this.box.geometry.boundingBox.min.y + this.specs.rails.bottomSpace,
      this.box.geometry.boundingBox.max.z - this.specs.rails.depthFromFront);
    let back_rail = new THREE.Vector3(
      this.box.geometry.boundingBox.min.x + this.specs.rails.spaceOnLeft+RAIL_WIDTH/2,
      this.box.geometry.boundingBox.min.y + this.specs.rails.bottomSpace,
      this.box.geometry.boundingBox.min.z + this.specs.rails.depthFromBack);
    let back_rail2 = new THREE.Vector3(
      this.box.geometry.boundingBox.min.x + this.specs.rails.spaceOnLeft+RAIL_WIDTH/2+483,
      this.box.geometry.boundingBox.min.y + this.specs.rails.bottomSpace,
      this.box.geometry.boundingBox.min.z + this.specs.rails.depthFromBack);
    let g = new THREE.BoxGeometry(RAIL_WIDTH, U_SIZE, 5);
    let m1 = new THREE.MeshBasicMaterial({color: 0xffffff});
    let m2 = new THREE.MeshBasicMaterial({color: 0xdadee5});

    for (let i = 1; i <= this.specs.u_height; i++) {
      let x = new THREE.Mesh(g, i % 2 ? m1 : m2)
      x.name = 'railfront'; x.userData=i;
      this.group.add(x)
      x.position.add(new THREE.Vector3(0, (i * 44.45 - 44.45 / 2), 0)).add(front_rail);
      x = new THREE.Mesh(g, i % 2 ? m1 : m2)
      x.name = 'railfront'; x.userData=i;
      this.group.add(x)
      x.position.add(new THREE.Vector3(0, (i * 44.45 - 44.45 / 2), 0)).add(front_rail2);
      x = new THREE.Mesh(g, i % 2 ? m1 : m2)
      x.name = 'railback'; x.userData=i;
      this.group.add(x)
      x.position.add(new THREE.Vector3(0, (i * 44.45 - 44.45 / 2), 0)).add(back_rail);
      x = new THREE.Mesh(g, i % 2 ? m1 : m2)
      x.name = 'railback'; x.userData=i;
      this.group.add(x)
      x.position.add(new THREE.Vector3(0, (i * 44.45 - 44.45 / 2), 0)).add(back_rail2);
    }
  };
  buildLabels() {
    this.labels.push(new Label(this,this.label,"top-front",{maxHeight:150}));
    this.labels.push(new Label(this,this.label,"top-back",{maxHeight:150}));
    this.labels.push(new Label(this,this.label,"top-center"));
  }
  buildRailLabels() {
      this.group.children.forEach((x) => {
        if (x.name.includes( 'rail')) {
          let labelText = x.userData;
          if (x.userData < 10) {
            labelText = ' ' + x.userData;
          }
          (x as any).geometry.computeBoundingBox();
          let where=x.name.includes('front')?"front":"back";
          this.labels.push(new Label(this, labelText, where,
            {
              kind:'rail',
              mesh: x}))
        }
      })
  }
  destroyRailLabels(){
    this.labels=this.labels.filter((l)=>{
      if('kind' in l.options && l.options.kind.includes('rail')){
        l.destroy()
        return false
      }
      return true
    })
  }
  addDevice(o:RackableDevice,u_pos,front) {
    this.addObject(o);
    if (o.isRackable) {
      o.u_pos = u_pos;
      o.front = front;
      o.rack = this;
    }else{
      if(o.kind=='pdu'){
        this.pduCnt+=o.specs.width;
        if(o.specs.position.x==0){ //undefined
          o.specs.position.copy(
            new THREE.Vector3(-this.specs.width/2+this.pduCnt,0,-this.specs.depth/2+10))
        }
      }
    }
    this.setDevicePosition(o);
  }

  setDevicePosition(o: RackableDevice|PDU) {
    if(o.isRackable) {
      o.group.position.setX(-(this.specs.width / 2) + this.specs.rails.spaceOnLeft + RAIL_WIDTH / 2 + o.specs.width / 2);
      if (o.front) {
        o.group.position.setY(-(this.specs.height / 2) + this.specs.rails.bottomSpace + U_SIZE * (o.u_pos - 1) + o.specs.height / 2);
        o.group.position.setZ(this.box.geometry.boundingBox.max.z - this.specs.rails.depthFromFront - o.specs.depth / 2 - 5)
      } else {
        o.group.position.setY(-(this.specs.height / 2) + this.specs.rails.bottomSpace + U_SIZE * (o.u_pos - 1) + o.specs.height / 2);
        o.group.position.setZ(this.box.geometry.boundingBox.min.z + this.specs.rails.depthFromBack + o.specs.depth / 2 + 5)
      }
    }else{
      o.group.position.copy(o.specs.position)
    }
    o.boxMoved()
  }

  rePositionRackables(){
    this.group.children.forEach(o=>{
      if(o.userData.isRackable){
        this.setDevicePosition(o.userData)
      }
    })
  }

  selected(){
    this.setHighlight();
    this.buildGUI()
  }
  canMoveRackedDevices=false;
  canMoveRackedDevicesF = ()=>{
    this.children.forEach(i=>{
      if(i.isRackable){
        i.canBeMoved=true;
        i.toggleMoves()
      }
    })
  }
  constrainMoves(o:Box,v:THREE.Vector3){
    if(o.isRackable){
      v.clamp(
        new THREE.Vector3(0,-this.specs.height/2+this.specs.rails.bottomSpace,0),
        new THREE.Vector3(0,-this.specs.height/2+this.specs.u_height*U_SIZE+this.specs.rails.bottomSpace,0)
      )
    }
  }

  buildGUI(){
    this.gui = new dat.GUI()
    let g:any={};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'canBeMoved').onFinishChange(this.toggleMoves)
    this.gui.add(this,'canMoveRackedDevices').onFinishChange(this.canMoveRackedDevicesF)

    this.gui.add(this,'label').onFinishChange(this.setLabelText);
    this.gui.add(this,'showLabels').onFinishChange(this.toggleLabels);
    this.gui.add(this,'showRailLabels').onFinishChange(this.toggleRailLabels);
    this.gui.addColor(this.specs, 'color');
    g.dim = this.gui.addFolder('Dimensions');
    g.dim.add(this.specs,'u_height').onFinishChange(this.shellChanged);
    g.dim.add(this.specs,'width').onFinishChange(this.shellChanged);
    g.dim.add(this.specs,'depth').onFinishChange(this.shellChanged);
    g.rail = g.dim.addFolder('Rails');
    g.rail.add(this.specs.rails,'spaceOnLeft').onFinishChange(this.railChanged);
    g.rail.add(this.specs.rails,'bottomSpace').onFinishChange(this.shellChanged);
    g.rail.add(this.specs.rails,'topSpace').onFinishChange(this.shellChanged);
    g.rail.add(this.specs.rails,'depthFromFront').onFinishChange(this.railChanged);
    g.rail.add(this.specs.rails,'depthFromBack').onFinishChange(this.railChanged);
    if(!this.isRoot){
      g.dim.add(this.specs,'rotationY',-180,180).step(1).onChange(this.rotateToAngle);
    }
    this.gui.add(this,'Save')
  }
  Save = ()=>{
    console.log(JSON.stringify(this.specs))
  }
  drag(e:THREE.Vector3){
    this.group.parent.worldToLocal(e.setY(this.specs.height/2+1))
    this.group.parent.userData.constrainMoves(this,e)
    this.group.position.copy(e)
    this.boxMoved()
  }
  getUFromVector(v:THREE.Vector3,u_height:number):number {
    let u = Math.round(
      ((this.specs.height / 2) + v.y - this.specs.rails.bottomSpace-(u_height*U_SIZE)/2+U_SIZE)/U_SIZE
     );
    if(u<1){return 1}
    if(u>this.specs.u_height){return this.specs.u_height}
    return u;

  }
  railChanged=()=> {
    this.destroyRailLabels();
    this.group.children
      .filter(o=>o.name.includes('rail'))
      .forEach(o=>this.group.remove(o))
    this.buildRails()
    if(this.showRailLabels) {
      this.buildRailLabels()
    }
    this.rePositionRackables()
  }
  toggleRailLabels = ()=>{
    if(this.showRailLabels){
      this.buildRailLabels()
    }else{
      this.destroyRailLabels()
    }
    this.display.render()
  }
  shellChanged = () =>{
    this.group.remove(this.box)
    this.destroyLabels();
    let oldHeight=this.specs.height;
    this.specs.height= this.specs.rails.bottomSpace+this.specs.u_height*44.45+this.specs.rails.topSpace;
    this.buildShell()
    this.group.add(this.box)
    this.box.userData=this;
    this.buildLabels()
    this.railChanged()
    //set it on the floor at the previous level
    this.group.position.add(new THREE.Vector3(0,(this.specs.height-oldHeight)/2,0))
    this.boxMoved()
  }

  rotateToAngle=(v)=>{
    let delta= this.rotation.y-v;
    this.rotateY(-delta);
  }
  setLabelText=(v)=>{
    this.label=v;
    this.labels.forEach(l=>{
      if('kind' in l.options && l.options.kind=='rail'){return}
      l.setLabelText(v)
    })
  }
  destroyGUI(){
    if(this.gui!=null){
      this.gui.destroy();
      this.gui=null;
    }
  }
  deselected(){
    this.clearHighlight();
    this.destroyGUI()
  }
  isSpaceFree(u,o){
    let res=true;
    this.children.forEach(c=>{
      if(c.isRackable){
        //to do
      }
    })
    return res
  }

}


const defaultRackableDeviceSpecs = {
    u_height: 1,
    width: 482,
    depth: 400,
    height: 42.45, // one u -2mm to have a bit of space
    color: "#4bf442",
    position: {x:0,y:0,z:0},
    rotationY: 0
};
class RackableDeviceSpecs extends ObjectSpecs {
  u_height:number;
  constructor(spec){
    super(spec);
    this.u_height=spec.u_height;
  }
}

export class RackableDevice extends Box {
  specs: RackableDeviceSpecs;
  u_pos: number;
  front: boolean; // is it racked in front or back
  rack: Rack;
  constructor(display: ThreeDisplay, id: number, label: string, specs?: any, isRoot?: boolean) {
    super(display, id, isRoot);
    this.kind = 'rackable';
    this.label = label;
    this.isRackable = true;
    if(specs!=undefined){this.specs=new RackableDeviceSpecs(specs)}
    else{ this.specs=new RackableDeviceSpecs(defaultRackableDeviceSpecs)}
    this.isRoot = isRoot;
    this.buildShell();
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
    this.rotateY(this.specs.rotationY)
  }

  buildShell(){
   let g = new THREE.BoxGeometry(this.specs.width, this.specs.height, this.specs.depth, 1, 1, 1)
          this.box=new THREE.Mesh(g,
              new THREE.MeshLambertMaterial( {color: this.specs.color, wireframe:false })
              );
  }

  buildLabels() {
    this.labels.push(new Label(this, this.label, "front"));
    this.labels.push(new Label(this, this.label, "back"));
  }
  last_pos;
  dragStart(){
    this.last_pos=this.u_pos;
  }
  drag(e:THREE.Vector3){
    this.group.parent.worldToLocal(e);
    this.group.parent.userData.constrainMoves(this,e)
    this.group.position.setY(e.y)
    this.boxMoved()
  }
  dragEnd(){
    let u=this.rack.getUFromVector(this.group.position,this.specs.u_height)
    if(u!=null && this.rack.isSpaceFree(u,this)){
      this.u_pos=u
    }
    this.rack.setDevicePosition(this)
  }
  selected(){
    this.setHighlight();
    this.buildGUI()
  }
  buildGUI() {
    this.gui = new dat.GUI()
    let g: any = {};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'canBeMoved').onFinishChange(this.toggleMoves)
    this.gui.add(this,'u_pos')
    this.gui.add(this,'front').onFinishChange(this.toggleFront)
    this.gui.add(this, 'label').onFinishChange(this.setLabelText);
    this.gui.addColor(this.specs, 'color');
  }
  toggleFront = ()=>{
    this.rack.setDevicePosition(this)
    this.boxMoved()
  }
  setLabelText=(v)=>{
    this.label=v;
    this.labels.forEach(l=>{l.setLabelText(v) })
  }
  deselected(){
    this.clearHighlight();
    this.destroyGUI()
  }
  destroyGUI(){
    if(this.gui!=null){
      this.gui.destroy();
      this.gui=null;
    }
  }
}


const defaultPDUSpecs= {
    u_height: 1,
    width: 50,
    depth: 70,
    height: 700, // one u -2mm to have a bit of space
    color: "#f47809",
    position: {x:0,y:0,z:0},
    rotationY: 0
};
class PDUSpecs extends ObjectSpecs {
  u_height:number;
  constructor(spec){
    super(spec);
    this.u_height=spec.u_height;
  }
}

export class PDU extends Box {
  specs: PDUSpecs;
  u_pos: number;
  front: boolean; // is it racked in front or back
  rack: Rack;
  constructor(display: ThreeDisplay, id: number, label: string, specs?: any, isRoot?: boolean) {
    super(display, id, isRoot);
    this.kind = 'pdu';
    this.label = label;
    this.isRackable = false;
    if(specs!=undefined){this.specs=new PDUSpecs(specs)}
    else{ this.specs=new PDUSpecs(defaultPDUSpecs)}
    this.isRoot = isRoot;
    this.buildShell()
    this.buildLabels()
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
    this.rotateY(this.specs.rotationY)
  }

  buildShell(){
   let g = new THREE.BoxGeometry(this.specs.width, this.specs.height, this.specs.depth, 1, 1, 1)
          this.box=new THREE.Mesh(g,
              new THREE.MeshLambertMaterial( {color: this.specs.color, wireframe:false })
              );
  }

  buildLabels() {
    this.labels.push(new Label(this, this.label, "front-vertical"));
    this.labels.push(new Label(this, this.label, "back-vertical"));
  }
  last_pos;
  dragStart(){
    this.last_pos=this.u_pos;
  }
  drag(e:THREE.Vector3){
    this.group.parent.worldToLocal(e);
    this.group.parent.userData.constrainMoves(this,e)
    this.group.position.copy(e)
    this.boxMoved()
  }
  dragEnd(){
    if(this.isRackable) {
      let u = this.rack.getUFromVector(this.group.position, this.specs.u_height)
      if (u != null && this.rack.isSpaceFree(u, this)) {
        this.u_pos = u
      }
      this.rack.setDevicePosition(this)
    }
  }
  selected(){
    this.setHighlight();
    this.buildGUI()
  }
  buildGUI() {
    this.gui = new dat.GUI()
    let g: any = {};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'canBeMoved').onFinishChange(this.toggleMoves)
    if(this.isRackable){
      this.gui.add(this,'u_pos')
      this.gui.add(this,'front').onFinishChange(this.toggleFront)
    }
    this.gui.add(this, 'label').onFinishChange(this.setLabelText);
    this.gui.addColor(this.specs, 'color');
  }
  toggleFront = ()=>{
    this.rack.setDevicePosition(this)
    this.boxMoved()
  }
  setLabelText=(v)=>{
    this.label=v;
    this.labels.forEach(l=>{l.setLabelText(v) })
  }
  deselected(){
    this.clearHighlight();
    this.destroyGUI()
  }
  destroyGUI(){
    if(this.gui!=null){
      this.gui.destroy();
      this.gui=null;
    }
  }
}



const defaultRoomSpecs = {
    width: 0, // doesn't matter
    depth: 0, // doesn't matter
    height: 5000, // one
    color: "#e3f7eb",
    position: {x:0,y:0,z:0},
    rotationY: 0,
    footPrint:[
      [0,0],[10000,0],[10000,5000],[0,5000]
    ]
};
class RoomSpecs extends ObjectSpecs {
  footPrint:THREE.Vector2[]=[];
  constructor(spec){
    super(spec);
    spec.footPrint.forEach(i=>{
      this.footPrint.push(new THREE.Vector2(i[0],i[1]))
    })
  }
}

export class Room extends Box {
  specs: RoomSpecs;
  gridHelper: THREE.GridHelper
  footPrintOnly=true;
  constructor(display: ThreeDisplay, id: number, label: string, specs?: any, isRoot?: boolean) {
    super(display, id, isRoot);
    this.kind = 'room';
    this.label = label;
    if(specs!=undefined){this.specs=new RoomSpecs(specs)}
    else{ this.specs=new RoomSpecs(defaultRoomSpecs)}
    this.isRoot = isRoot;
    this.buildShell()
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
    this.rotateY(this.specs.rotationY)
    this.buildGrid()
    let t=new toolTip(this.display)
    t.setText("bla bla")
    t.setFromVector(new THREE.Vector3(0,0,0))
  }
  buildGrid(){
    this.gridHelper = new THREE.GridHelper( 10000, 100);
    this.display.glScene.add(this.gridHelper)
  }
  buildShell(){
    let shape = new THREE.Shape()
            this.specs.footPrint.forEach((x,i)=>{
                if(i==0){shape.moveTo(x.x,x.y)}
                else{shape.lineTo(x.x,x.y)}
            })
    shape.lineTo(this.specs.footPrint[0].x,this.specs.footPrint[0].y)
    let g = this.footPrintOnly? new THREE.ExtrudeGeometry(shape,{steps:1,amount:1}):
                new THREE.ExtrudeGeometry(shape,{steps:1,amount:this.specs.height})
    this.box=new THREE.Mesh(g,
                new THREE.MeshBasicMaterial( { color: this.specs.color, side: THREE.DoubleSide,
                wireframe:!this.footPrintOnly
                } ));
    this.box.rotateX((90 * Math.PI)/180)
    this.box.position.set(0,-10,0)

  }

  addDevice(o:Box,pos:THREE.Vector3,onFloor?:boolean){
    this.addObject(o);
    if(onFloor==undefined){onFloor=true}
    if(onFloor && pos.y==0) {
      o.group.position.copy(pos);
      o.group.position.add(new THREE.Vector3(0,o.specs.height/2+1,0))
    }
    o.boxMoved();
  }
    selected(){
    this.setHighlight();
    this.buildGUI()
  }
  editFootprint=false;
  buildGUI() {
    this.gui = new dat.GUI()
    let g: any = {};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'editFootprint').onFinishChange(this.toggleEdits)
    this.gui.addColor(this.specs, 'color');
  }

  toggleEdits(){
    if(this.editFootprint){this.editRoom()}
    else{this.stopEditor()}
  }

  editRoom(){

  }

  stopEditor(){

  }


  deselected(){
    this.clearHighlight();
    this.destroyGUI()
  }
  destroyGUI(){
    if(this.gui!=null){
      this.gui.destroy();
      this.gui=null;
    }
  }

}


const defaultRowSpecs ={
    width: 5000,
    depth: 1000,
    height: 2500, // bottom+u_sizes+topspace
    color: "#f5401f",
    position: {x:0,y:0,z:0},
    rotationY: 25,
};

class RowSpecs extends ObjectSpecs {

  constructor(o){
    super(o);

  }
}

export class Row extends Box {
  specs:RowSpecs;
  constructor(display:ThreeDisplay,id:number, label:string, o?:any, isRoot?:boolean){
    super(display,id,isRoot);
    this.kind='row';
    this.label=label;
    this.showLabels=true;
    if(o!=undefined){this.specs=new RowSpecs(o)}
    else{ this.specs=new RowSpecs(defaultRowSpecs)}
    this.buildShell()
    this.buildLabels()
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
    this.rotateY(this.specs.rotationY)
  }
  buildShell() {
    let g = new THREE.BoxGeometry(this.specs.width, this.specs.height, this.specs.depth);
    this.box = new THREE.Mesh(g,
      new THREE.MeshLambertMaterial({
        color: this.specs.color, side: THREE.DoubleSide,
        wireframe: true
      }));
  }
  constrainMoves(o:Box,v:THREE.Vector3){
    v.setZ(0)
  }

  buildLabels() {
    this.labels.push(new Label(this,this.label,"top-left",{maxHeight:150}));
    this.labels.push(new Label(this,this.label,"top-right",{maxHeight:150}));
  }
  addDevice(o:Box,pos:THREE.Vector3,onFloor?:boolean){
    this.addObject(o);
    if(onFloor==undefined){onFloor=true}
    if(onFloor && pos.y==0) {
      o.group.position.copy(pos);
      o.group.position.add(new THREE.Vector3(0,-this.specs.height/2+o.specs.height/2+1,0))
    }
    o.boxMoved();
  }
  selected(){
    this.setHighlight();
    this.buildGUI()
  }
  canMoveRacks=false;
  canMoveRacksF = ()=>{
    this.children.forEach(i=>{
        i.canBeMoved=true;
        i.toggleMoves()
    })
  }
  buildGUI(){
    this.gui = new dat.GUI()
    let g:any={};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'canBeMoved').onFinishChange(this.toggleMoves)
    this.gui.add(this,'canMoveRacks').onFinishChange(this.canMoveRacksF)

    this.gui.add(this,'label').onFinishChange(this.setLabelText);
    this.gui.add(this,'showLabels').onFinishChange(this.toggleLabels);
    this.gui.addColor(this.specs, 'color');
    g.dim = this.gui.addFolder('Dimensions');
    g.dim.add(this.specs,'height').onFinishChange(this.shellChanged);
    g.dim.add(this.specs,'width').onFinishChange(this.shellChanged);
    g.dim.add(this.specs,'depth').onFinishChange(this.shellChanged);
    if(!this.isRoot){
      g.dim.add(this.specs,'rotationY',-180,180).step(1).onChange(this.rotateToAngle);
    }
    this.gui.add(this,'Save')
  }
  Save = ()=>{
    console.log(JSON.stringify(this.specs))
  }
  drag(e:THREE.Vector3){
    this.group.parent.userData.constrainMoves(this,e);
    this.group.position.copy(this.group.parent.worldToLocal(e.setY(this.specs.height/2+1)))
    this.boxMoved()
  }

  shellChanged = () =>{
    this.group.remove(this.box)
    this.destroyLabels();
    let oldHeight=this.specs.height;
    this.buildShell()
    this.group.add(this.box)
    this.box.userData=this;
    this.buildLabels()
    //set it on the floor at the previous level
    this.group.position.add(new THREE.Vector3(0,(this.specs.height-oldHeight)/2,0))
    this.boxMoved()
  }

  rotateToAngle=(v)=>{
    let delta= this.rotation.y-v;
    this.rotateY(-delta);
  }
  setLabelText=(v)=>{
    this.label=v;
    this.labels.forEach(l=>{
      if('kind' in l.options && l.options.kind=='rail'){return}
      l.setLabelText(v)
    })
  }
  destroyGUI(){
    if(this.gui!=null){
      this.gui.destroy();
      this.gui=null;
    }
  }
  deselected(){
    this.clearHighlight();
    this.destroyGUI()
  }
}


export class toolTip {
  element=document.createElement('div')
  pos:THREE.Vector3
  constructor(private display){
    this.element.style.zIndex="20";
    this.element.style.position="absolute";
    this.display.toolTipRender.appendChild(this.element)
    this.display.toolTips.push(this)
  }
  setText(text:string){
    this.element.textContent=text;
  }
  setFromVector(v:THREE.Vector3){
    this.pos=v
  }
  update(vector:THREE.Vector3){
    let canvas = this.display.glRenderer.domElement;
    let v=this.pos.clone()
    v.project( this.display.camera );
    let x = Math.round( (   v.x + 1 ) * canvas.width  / 2 );
    let y = Math.round( ( - v.y + 1 ) * canvas.height / 2 );
    this.element.style.left=x+'px'
    this.element.style.top=y+'px'
  }

  destroy(){
    this.display.cssScene.remove(this.cssText);
    this.element.remove();
  }
}

export class Label {
  static fontSize = 14;
  static font = '14px Helvetica';
  hole=null; // we need to punch a hole in the css
  display: ThreeDisplay;
  element = document.createElement('div');
  cssText = new THREE.CSS3DObject(this.element)
  textWidth: number;
  scale:number;
  firstTime=true;
  constructor(private o: Box, private text: string, private where: string,public options?:any) {
    this.text = text;
    this.display = o.display;
    if(this.options==undefined){
      this.options={}
    }
    this.o.box.geometry.computeBoundingBox();
    this.element.style.font = Label.font;
    this.element.style.background = 'white';
    this.setLabelText(text);
    this.display.cssScene.add(this.cssText);
    this.hole.userData={"kind":"hole"};

  }

  setLabelText(text:string){
    this.element.textContent = text
    this.element.textContent=text;
    this.text=text;
    this.textWidth = this.getTextWidth(this.text);
    let geometry = new THREE.PlaneGeometry(this.textWidth, Label.fontSize);
    if(this.hole!=null){
      this.o.group.remove(this.hole)
    }
    this.hole = new THREE.Mesh(geometry,
      new THREE.MeshLambertMaterial({color: 0x000000, opacity: 0.0, side: THREE.DoubleSide}));
    if(this.where=='top-center') {
      this.hole.rotateX((-90 * Math.PI) / 180)
      if(this.firstTime){
        this.cssText.rotateX((-90 * Math.PI) / 180)
        this.firstTime=false;
      }
    }
    this.o.group.add(this.hole);
    this.setScale();
    this.setPosition();
    this.display.labelUpdates.push(this)
  }

  setPosition(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;
    if('position' in this.options){
      this.hole.position.copy(this.options.position);
    }else {
      switch (this.where) {
        case 'top-front':
          this.hole.position.copy(new THREE.Vector3(0, max.y, max.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0));
          break
        case 'top-back':
          this.hole.position.copy(new THREE.Vector3(0, max.y, min.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
          this.hole.rotateY(Math.PI)
          break
        case 'top-back':
          this.hole.position.copy(new THREE.Vector3(0, max.y, min.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
          this.hole.rotateY(Math.PI);
          break
        case 'top-left':
          this.hole.position.copy(new THREE.Vector3(min.x, max.y, 0))
          this.hole.position.add(new THREE.Vector3(Label.fontSize / 2 * this.scale, 1, 0))
          this.hole.rotateY(Math.PI / 2)
          this.hole.rotateX(-Math.PI / 2)
          break

        case 'top-right':
          this.hole.position.copy(new THREE.Vector3(max.x, max.y, 0))
          this.hole.position.add(new THREE.Vector3(-Label.fontSize / 2 * this.scale, 1, 0))
          this.hole.rotateY(-Math.PI / 2)
          this.hole.rotateX(-Math.PI / 2);
          break
        case 'top-center':
          this.hole.position.copy(new THREE.Vector3(0, max.y + 1, 0));
          break;
        case 'front':
        case 'front-vertical':
          if ('mesh' in this.options) {
            this.hole.position.copy(this.options.mesh.position).add(new THREE.Vector3(0, 0, max.z + 1))
          } else {
            this.hole.position.copy(new THREE.Vector3(0, 0, max.z + 1))
          }
          break;
        case 'back':
        case 'back-vertical':
          if ('mesh' in this.options) {
            this.hole.position.copy(this.options.mesh.position).add(new THREE.Vector3(0, 0, min.z - 1))
          } else {
            this.hole.position.copy(new THREE.Vector3(0, 0, min.z - 1))
          }
          this.hole.rotateY(Math.PI)
          break;
      }
      if(this.where.includes('vertical')){
       this.hole.rotateZ((90*Math.PI)/180)
       //this.hole.rotateY()
      }
    }
    this.cssText.position.copy(this.hole.position)
    this.o.group.localToWorld(this.cssText.position)
  }

  setScale(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;
    let maxHeight=('maxHeight' in this.options)?this.options.maxHeight:max.y - min.y;
    let maxWidth=('maxWidth' in this.options)?this.options.maxWidth:max.x - min.x;
    let scaleX=Math.abs(maxWidth/this.textWidth);
    let scaleY=Math.abs(maxHeight/Label.fontSize);
    if(this.where.includes('vertical')){
      scaleX=Math.abs((maxHeight-2)/this.textWidth);
      scaleY=Math.abs((maxWidth-2)/Label.fontSize);
    }
    this.scale= (scaleX<scaleY)?scaleX:scaleY;
    this.hole.scale.set(this.scale,this.scale,1);
    this.cssText.scale.copy(this.hole.scale)
  }
  getTextWidth(text) {
    this.display.ctxCanvas2D.font = Label.font;
    return this.display.ctxCanvas2D.measureText(text).width;
  }
  boxMoved() {
    this.display.labelUpdates.push(this);
  }
  updatePosition(){ // rquires the world matrix to be updated
    this.cssText.position.copy(this.hole.position)
    this.cssText.rotation.copy(this.hole.getWorldRotation())
    this.o.group.localToWorld(this.cssText.position)
  }

  destroy(){
    this.o.group.remove(this.hole);
    this.display.cssScene.remove(this.cssText);
    this.element.remove();
  }

}
