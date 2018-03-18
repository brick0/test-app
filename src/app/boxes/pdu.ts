import {Rack} from "./rack";
import {Box, ObjectSpecs, ThreeDisplay} from "./box";
import * as THREE from "three";
import {Label} from "./label";
import * as dat from 'dat.gui/build/dat.gui.js';

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

