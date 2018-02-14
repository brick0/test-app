import * as THREE from 'three';
import "../three-display/enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import {ThreeBSP} from "./ThreeCSG";
import {Vector3} from "three";

export interface ThreeDisplay {
  glRenderer: THREE.WebGLRenderer;
  cssRenderer: THREE.CSS3DRenderer;
  glScene: THREE.Scene;
  cssScene: THREE.Scene;
  camera: THREE.Camera;
  ctxCanvas2D: CanvasRenderingContext2D;
  render: ()=>void;
}

export class Box {
      o:any;                     // user data
      box: THREE.Mesh;           // the main mesh of this thing
      group = new THREE.Group(); // grouping of everything
      label:string;
      kind:string;
      labels:Label[] = [];
      totalRotation = new THREE.Vector3(0,0,0); // placeholder to keep track of total rotations
      specs:ObjectSpecs;
      isRoot:boolean = false;
      children:Box[]= [];

  constructor(public display:ThreeDisplay, public id:number,  isRoot:boolean) {
        this.group.userData=this;
        if (isRoot){
          this.isRoot=isRoot;
          this.display.glScene.add(this.group)
        }
  }

  addObject(o:Box){
    o.updateTotalRotation(this.group.rotation.toVector3())
    this.group.add(o.group);
    this.children.push(o);
  }

  rotateY(angle){
    this.group.rotateY((angle*Math.PI)/180);
    this.updateTotalRotation(this.group.rotation.toVector3())
    this.children.forEach(c => c.updateTotalRotation(this.group.rotation.toVector3()))
  }

  updateTotalRotation(v:THREE.Vector3){
    this.totalRotation.add(v);
    this.children.forEach(c => c.updateTotalRotation(this.group.rotation.toVector3()))
    this.display.glScene.updateMatrixWorld(true); //need this to be able to copy to world pos
    this.labels.forEach(l=>{ l.boxMoved()})
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
    height: 100+42*44.45+100, // bottom+u_sizes+topspace
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
      console.log("default specs")
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
    this.isRoot=true;
    this.buildShell()
    this.buildRails()
    this.buildLabels()

    this.group.add(this.box)
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
    this.labels.push(new Label(this,this.label,"top-front"));
    this.labels.push(new Label(this,this.label,"top-back"));
    this.labels.push(new Label(this,this.label,"top-center"));
    if (this.isRoot) {
      console.log('making rail labels');
      this.group.children.forEach((x) => {
        if (x.name == 'rail') {
          let labelText=x.userData.i;
          if(x.userData.i<10){labelText=' '+x.userData.i;}
          x.geometry.computeBoundingBox()
          this.labels.push(new Label(this,labelText,"mid-center",
            {mesh:x, position:x.position.clone().add(new THREE.Vector3(0,0,-1))}))
        }
      })
    }

  }

}


const defaultRackableDeviceSpecs : RackableDeviceSpecs= {
    u_height: 1,
    width: 482,
    depth: 800,
    height: 44.45, // bottom+u_sizes+topspace
    color: "#42c2f4",
    position: new THREE.Vector3(0,0,0),
    rotation: 0
};
class RackableDeviceSpecs extends ObjectSpecs {

  constructor(o){
    super();
    if(o!=undefined){
      this.u_height=o.u_height;
      this.height= this.u_height*44.45;
      this.color = o.color
    }else{
      console.log("default specs")
      return defaultRackableDeviceSpecs;
    }
  }
}


class Label {
  static fontSize = 14;
  static font = '14px Helvetica';
  hole; // we need to punch a hole in the css
  display: ThreeDisplay;
  element = document.createElement('div');
  cssText = new THREE.CSS3DObject(this.element)
  textWidth: number;
  scale:number;
  constructor(private o: Box, private text: string, private where: string,private options?:any) {
    this.text = text;
    this.display = o.display;
    this.element.textContent = text
    this.element.style.font = Label.font;
    this.element.style.background = 'white';
    if(this.options==undefined){
      this.options={}
    }
    this.o.box.geometry.computeBoundingBox();
    this.textWidth = this.getTextWidth(this.text);
    let geometry = new THREE.PlaneGeometry(this.textWidth, Label.fontSize);

    this.hole = new THREE.Mesh(geometry,
      new THREE.MeshLambertMaterial({color: 0x000000, opacity: 0.0, side: THREE.DoubleSide}));
    this.o.group.add(this.hole);
    this.display.cssScene.add(this.cssText);
    this.setScale();
    this.setPosition();
    this.setRotation();

    this.hole.userData={"kind":"hole"};
    this.display.glScene.updateMatrixWorld(true);

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
    }
    this.cssText.position.copy(this.hole.position)
    this.o.group.localToWorld(this.cssText.position)
  }
  setRotation(){
     if(this.where=='top-center') {
      this.hole.rotateX((-90 * Math.PI) / 180)
      this.cssText.rotateX((-90 * Math.PI) / 180)
    }
  }
  setScale(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;

    this.options.maxWidth = max.x - min.x ;
    this.options.maxHeight = max.y - min.y ;
    let scaleX=Math.abs(this.options.maxWidth/this.textWidth);
    let scaleY=Math.abs(this.options.maxHeight/Label.fontSize);
    this.scale= (scaleX<scaleY)?scaleX:scaleY;
    this.hole.scale.set(this.scale,this.scale,1);
    this.cssText.scale.copy(this.hole.scale)
  }
  getTextWidth(text) {
    this.display.ctxCanvas2D.font = Label.font;
    return this.display.ctxCanvas2D.measureText(text).width;
  }

  boxMoved() {
    let rotation=this.o.totalRotation
    this.cssText.rotation.setFromVector3(rotation)
    if (this.where.includes('back')) {
      this.cssText.rotateY(Math.PI)
    }
    if (this.where=='top-center'){
      let v = rotation.clone().setX(0)
      this.cssText.rotation.setFromVector3(v);
      this.cssText.rotateX((-90 * Math.PI) / 180)
    }
    this.cssText.position.copy(this.hole.position)
    this.o.group.localToWorld(this.cssText.position)
  }


}
