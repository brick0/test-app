import {Box, ObjectSpecs, ThreeDisplay, U_SIZE} from "./box";
import * as THREE from "three";
import {ThreeBSP} from "./ThreeCSG";
import * as dat from 'dat.gui/build/dat.gui.js';
import {Label} from "./label";
import {PDU} from "./pdu";
import {RackableDevice} from "./rackable";



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
