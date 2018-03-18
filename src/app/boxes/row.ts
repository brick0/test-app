import {Box, ObjectSpecs, ThreeDisplay} from "./box";
import * as THREE from "three";
import {Label} from "./label";
import * as dat from 'dat.gui/build/dat.gui.js';

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

