import {Box, ObjectSpecs, ThreeDisplay} from "./box";
import * as THREE from "three";
import * as dat from 'dat.gui/build/dat.gui.js';
import {Marker} from "./marker";
import {toolTip} from "./tooltip";
import {Vector2} from "three";

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
    //this.buildGrid()
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

  toggleEdits =()=>{
    if(this.editFootprint){this.editRoom()}
    else{this.stopEditor()}
  }
  markers:Marker[]=[]

  editRoom(){
    this.editFootprint=true;
    let g = new THREE.SphereGeometry(100)
    this.display.saveClickables();
    this.display.clickable.push(this.box)
    this.markers=[];
    this.specs.footPrint.forEach((p,i)=>{
      let m=new Marker(this,'roomVert',i);
      m.setToolTip(i)
      m.setPosition(new THREE.Vector3(p.x,0,p.y))
      this.markers.push(m)
      m=new Marker(this,'midpoint',i)
      let middle=new THREE.Vector3(p.x,0,p.y)
      let next=this.specs.footPrint[(i<this.specs.footPrint.length-1)?i+1:0]
      let nv=new THREE.Vector3(next.x,0,next.y)
      m.setToolTip(Math.round(middle.distanceTo(nv)).toLocaleString()+"mm")
      middle.add(nv)
      middle.divideScalar(2)
      m.setPosition(middle)
      this.markers.push(m)
    });

    this.boxMoved();
  }
  markerUpdated(m:Marker,moveFinished:boolean){
    if(moveFinished && m.kind=='roomVert'){
      let l=this.markers.filter(n=> n.kind=='roomVert'&& n.id!=m.id && m.m.position.distanceTo(n.m.position)<30)
      if (l.length>0){
        this.specs.footPrint.splice(m.id,1);
        this.group.remove(this.box);
        this.buildShell()
        this.group.add(this.box);
        this.markers=this.markers.filter(n=>{
          if(n.id==m.id){n.destroy();return false}
          if(n.id>m.id){n.id--}
          return true;
        })
      }
      return
    }
    if(m.kind=='roomVert') {
      this.specs.footPrint[m.id].set(m.m.position.x, m.m.position.z);
      this.group.remove(this.box);
      this.buildShell()
      this.group.add(this.box);
      this.markers.forEach(i=>{
        if(i.kind=='midpoint'){
          let middle=new THREE.Vector3(this.specs.footPrint[i.id].x,0,this.specs.footPrint[i.id].y)
          let next=this.specs.footPrint[(i.id<this.specs.footPrint.length-1)?i.id+1:0]
          let nv=new THREE.Vector3(next.x,0,next.y)
          i.setToolTip(Math.round(middle.distanceTo(nv)).toLocaleString()+"mm")
          middle.add(nv).divideScalar(2)
          i.setPosition(middle)
        }
      })
    }
    if(m.kind=='midpoint'){
      this.specs.footPrint.splice(m.id+1,0,new Vector2(m.m.position.x,m.m.position.z))
      this.group.remove(this.box);
      this.buildShell()
      this.group.add(this.box);
      this.markers.forEach((p)=>{
        if(p.id>m.id){p.id++;p.setToolTip(p.id)}
      })
      m.id++;
      m.setToolTip(m.id)
      m.makeRoomVert();
      let i=m.id-1>=0?m.id-1:this.specs.footPrint.length-1
      let n=new Marker(this,'midpoint', i)
      let middle=new THREE.Vector3(this.specs.footPrint[i].x,0,this.specs.footPrint[i].y)
      let next=this.specs.footPrint[(i<this.specs.footPrint.length-1)?i+1:0]
      middle.add(new THREE.Vector3(next.x,0,next.y))
      middle.divideScalar(2)
      n.setPosition(middle)
      this.markers.push(n)
      i=m.id
      n=new Marker(this,'midpoint', i)
      middle=new THREE.Vector3(this.specs.footPrint[i].x,0,this.specs.footPrint[i].y)
      next=this.specs.footPrint[(i<this.specs.footPrint.length-1)?i+1:0]
      middle.add(new THREE.Vector3(next.x,0,next.y))
      middle.divideScalar(2)
      n.setPosition(middle)
      this.markers.push(n)
    }
    this.boxMoved();

  }
  stopEditor(){
    this.display.restoreClickables();
    this.markers.forEach(m=>m.destroy())
    this.markers=[];
    this.boxMoved();
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
