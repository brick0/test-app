import {Rack} from "./rack";
import {Box, ObjectSpecs, ThreeDisplay} from "./box";
import * as THREE from "three";
import {Label} from "./label";
import * as dat from 'dat.gui/build/dat.gui.js';

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



