import * as THREE from 'three';
import "../three-display/enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import {ThreeBSP} from "./ThreeCSG";
import {Vector3} from "three";
import * as dat from 'dat.gui/build/dat.gui.js';

export interface ThreeDisplay {
  glRenderer: THREE.WebGLRenderer;
  cssRenderer: THREE.CSS3DRenderer;
  glScene: THREE.Scene;
  cssScene: THREE.Scene;
  camera: THREE.Camera;
  ctxCanvas2D: CanvasRenderingContext2D;
  render: ()=>void;
  labelUpdates:Label[];
  refreshLabels:()=>void;
  clickable:any[];
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
    let x = this.box.material as THREE.MeshBasicMaterial
    x.color.offsetHSL(0, 0, .3);
  }

  clearHighlight = () => {
    let x = this.box.material as THREE.MeshBasicMaterial;
    x.color.set(this.specs.color as string);
  }
}


class ObjectSpecs {
  color:THREE.Color | string;
  width:number;
  height:number;
  depth:number;
  rotation:number;
  u_height?: number; // height in Us
  position : THREE.Vector3;
}

const defaultRackSpecs : RackSpecs= {
    u_height: 42,
    front_rail: new THREE.Vector3(100, 100, 100),
    back_rail: new THREE.Vector3( 100,  100, -400),
    width: 482.6 + 200,
    depth: 1000,
    height: 100+42*U_SIZE+100, // bottom+u_sizes+topspace
    color: "#f221f2",
    position: new THREE.Vector3(0,0,0),
    rotation: 0,
    topSpace: 100
};
class RackSpecs extends ObjectSpecs {

  front_rail:THREE.Vector3; //where is the bottom of left front rail set
  back_rail:THREE.Vector3; //where is the left back rail set
  topSpace: number;  // how much space from top of rail to top of rack

  constructor(o){
    super();
    if(o!=undefined){
      this.u_height=o.u_height;
      this.topSpace=o.topSpace;
      this.front_rail=new THREE.Vector3(o.front_rail.x,o.front_rail.y,o.front_rail.z)
      this.back_rail=new THREE.Vector3(o.back_rail.x,o.back_rail.y,o.back_rail.z)
      this.height= this.front_rail.y+this.u_height*44.45+this.topSpace;
      this.color = o.color
    }else{
      return defaultRackSpecs;
    }
  }
}

export class Rack extends Box {
  specs:RackSpecs;
  constructor(display:ThreeDisplay,id:number, label:string, o?:any, isRoot?:boolean){
    super(display,id,isRoot);
    this.kind='rack';
    this.label=label;
    this.specs=new RackSpecs(o)
    this.buildShell()
    this.buildRails()
    this.buildLabels()
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
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
      this.box.geometry.boundingBox.min.x + this.specs.front_rail.x,
      this.box.geometry.boundingBox.min.y + this.specs.front_rail.y,
      this.box.geometry.boundingBox.max.z - this.specs.front_rail.z);
    let back_rail = new THREE.Vector3(
      this.box.geometry.boundingBox.min.x + this.specs.back_rail.x,
      this.box.geometry.boundingBox.min.y + this.specs.back_rail.y,
      this.box.geometry.boundingBox.min.z + this.specs.front_rail.z);
    let g = new THREE.BoxGeometry(-30, 44.45, 5);
    let m1 = new THREE.MeshBasicMaterial({color: 0xffffff});
    let m2 = new THREE.MeshBasicMaterial({color: 0xdadee5});

    for (let i = 1; i <= this.specs.u_height; i++) {
      let x = new THREE.Mesh(g, i % 2 ? m1 : m2)
      x.name = 'rail';
      x.userData = {kind: 'urail', i: i}
      this.group.add(x)
      x.position.add(new THREE.Vector3(0, (i * 44.45 - 44.45 / 2), 0));
      x.position.add(front_rail);
    }
  };
  buildLabels() {
    this.labels.push(new Label(this,this.label,"top-front",{maxHeight:150}));
    this.labels.push(new Label(this,this.label,"top-back",{maxHeight:150}));
    this.labels.push(new Label(this,this.label,"top-center"));
  }
  buildRailLabels() {
      this.group.children.forEach((x) => {
        if (x.name == 'rail') {
          let labelText = x.userData.i;
          if (x.userData.i < 10) {
            labelText = ' ' + x.userData.i;
          }
          (x as any).geometry.computeBoundingBox()
          this.labels.push(new Label(this, labelText, "mid-center",
            {mesh: x, position: x.position.clone().add(new THREE.Vector3(0, 0, -1))}))
        }
      })
  }
  addDevice(o:Box,u_pos,front){
    this.addObject(o);
    o.group.position.setY(-(this.specs.height/2)+this.specs.front_rail.y+U_SIZE*u_pos+o.specs.height/2)
    o.boxMoved();
  }
  selected(){
    this.setHighlight();
    this.buildGUI()
  }
  buildGUI(){
    this.gui = new dat.GUI()
    let g:any={};
    let ge = this.gui.addFolder('General')
    this.gui.add(this,'label').onFinishChange(this.setLabelText);
    g.position=this.gui.addFolder('Position');
    if(!this.isRoot){
      g.position.add(this.specs,'rotation',-180,180).step(1).onChange(this.rotateToAngle);}
  /*  g.fr = this.gui.addFolder('Front Rail Position');
    g.fr.add(this.specs.front_rail,'x').onFinishChange(this.dimChanged);
    g.fr.add(this.specs.front_rail,'y').onFinishChange(this.dimChanged);
    g.fr.add(this.specs.front_rail,'z').onFinishChange(this.dimChanged);

    g.fr = this.gui.addFolder('Back Rail Position');
    g.fr.add(this.specs.back_rail,'x').onFinishChange(this.dimChanged);
    g.fr.add(this.specs.back_rail,'y').onFinishChange(this.dimChanged);
    g.fr.add(this.specs.back_rail,'z').onFinishChange(this.dimChanged);
*/
  }
  rotateToAngle=(v)=>{
    console.log(v)
    let delta= this.rotation.y-v;
    this.rotateY(-delta);
    this.display.refreshLabels()
  }
  setLabelText=(v)=>{
    console.log(v);
    this.label=v;
    this.labels.forEach(l=>l.setLabelText(v))
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


const defaultRackableDeviceSpecs : RackableDeviceSpecs= {
    u_height: 1,
    width: 482,
    depth: 800,
    height: 42.45, // one u -2mm to have a bit of space
    color: "#4bf442",
    position: new THREE.Vector3(0,0,0),
    rotation: 0
};
class RackableDeviceSpecs extends ObjectSpecs {

  constructor(spec){
    super();
    if(spec!=undefined){
      this.u_height=spec.u_height;
      this.height= this.u_height*44.45-2;
      this.color = spec.color
    }else{
      return defaultRackableDeviceSpecs;
    }
  }
}

export class RackableDevice extends Box {
  specs: RackableDeviceSpecs;

  constructor(display: ThreeDisplay, id: number, label: string, specs?: any, isRoot?: boolean) {
    super(display, id, isRoot);
    this.kind = 'rackable';
    this.label = label;
    this.specs = new RackableDeviceSpecs(specs)
    this.isRoot = isRoot;
    this.buildShell()
    this.group.add(this.box)
    this.box.userData=this;
    this.display.clickable.push(this.box);
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
    this.labels.forEach(l=>{l.boxRotated();l.boxMoved()})
    this.display.labelUpdates.concat(this.labels);
  }

}


const defaultRoomSpecs : RoomSpecs= {
    u_height: 1,
    width: 0, // doesn't matter
    depth: 0, // doesn't matter
    height: 5000, // one u
    color: "#e3f7eb",
    position: new THREE.Vector3(0,0,0),
    rotation: 0,
    footPrint:[
      new THREE.Vector2(0,0),
      new THREE.Vector2(10000,0),
      new THREE.Vector2(10000,5000),
      new THREE.Vector2(0,5000)
    ]
};
class RoomSpecs extends ObjectSpecs {
  footPrint:THREE.Vector2[];
  constructor(spec){
    super();
    if(spec!=undefined){
      this.height= this.u_height*44.45;
      this.color = spec.color
    }else{
      return defaultRoomSpecs;
    }
  }
}

export class Room extends Box {
  specs: RoomSpecs;
  footPrintOnly=true;
  constructor(display: ThreeDisplay, id: number, label: string, specs?: any, isRoot?: boolean) {
    super(display, id, isRoot);
    this.kind = 'room';
    this.label = label;
    this.specs = new RoomSpecs(specs)
    this.isRoot = isRoot;
    this.buildShell()
    this.group.add(this.box)
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

  addDevice(o:Box,pos:THREE.Vector3){
    this.addObject(o);
    if(pos.y==0) {
      o.group.position.copy(pos);
      o.group.position.add(new THREE.Vector3(0,o.specs.height/2+1,0))
    }
    o.boxMoved();
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
  constructor(private o: Box, private text: string, private where: string,private options?:any) {
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
  }

  setPosition(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;
    if('position' in this.options){
      this.hole.position.copy(this.options.position);
    }else {
      if (this.where == 'top-front') {
        this.hole.position.copy(new THREE.Vector3(0, max.y, max.z))
        this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
      }
      if (this.where == 'top-back') {
        this.hole.position.copy(new THREE.Vector3(0, max.y, min.z))
        this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
      }
      if (this.where == 'top-center') {
        this.hole.position.copy(new THREE.Vector3(0, max.y + 1, 0))
      }
      if (this.where == 'mid-center') {
        this.hole.position.copy(new THREE.Vector3(0, 0, max.z))
      }
      if(this.where =='front'){
        this.hole.position.copy(new THREE.Vector3(0, 0, max.z+1))
      }
      if(this.where =='back'){
        this.hole.position.copy(new THREE.Vector3(0, 0, min.z-1))
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
    this.scale= (scaleX<scaleY)?scaleX:scaleY;
    this.hole.scale.set(this.scale,this.scale,1);
    this.cssText.scale.copy(this.hole.scale)
  }
  getTextWidth(text) {
    this.display.ctxCanvas2D.font = Label.font;
    return this.display.ctxCanvas2D.measureText(text).width;
  }
  boxRotated(){
    let rotation=new THREE.Vector3(0,0,0)
    let parent=this.o.group;
    console.log('-----------------------',this.o.kind)
    while(parent!=null){
      console.log(parent);
      rotation.add(this.o.group.rotation.toVector3())
      parent=parent.parent
    }
    console.log(rotation);
    console.log(this.o.group.rotation)
    this.cssText.rotation.setFromVector3(rotation)
    if (this.where.includes('back')) {
      this.cssText.rotateY(Math.PI)
    }
    if (this.where=='top-center'){
      let v = rotation.clone().setX(0)
      this.cssText.rotation.setFromVector3(v);
      this.cssText.rotateX((-90 * Math.PI) / 180)
    }
    this.display.labelUpdates.push(this);
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
