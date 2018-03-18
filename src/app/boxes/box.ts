import * as THREE from 'three';
import "../three-display/enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/DragControls"

import {ThreeBSP} from "./ThreeCSG";
import {Vector3} from "three";
import * as dat from 'dat.gui/build/dat.gui.js';
import {DragControls} from "./DragControls";
import {Rack} from "./rack";
import {Label} from "./label";

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
  toolTips:any[];
  saveClickables:()=>void;
  restoreClickables:()=>void;
}

export const U_SIZE=44.45;

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


export class ObjectSpecs {
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







