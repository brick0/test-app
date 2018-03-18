import * as THREE from 'three';
import "../three-display/enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/DragControls"

import {ThreeBSP} from "./ThreeCSG";
import {Vector3} from "three";
import * as dat from 'dat.gui/build/dat.gui.js';
import {DragControls} from "./DragControls";
import {Label} from "./label";
import {Marker} from "./marker";

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
  markerUpdated(m:Marker,moveFinidhed:boolean){}
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





