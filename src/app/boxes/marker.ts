import {Box, ThreeDisplay} from "./box";
import * as THREE from "three";
import {toolTip} from "./tooltip";

export class Marker {
    m:THREE.Object3D;
    toolTip:toolTip=null;
    constructor(private box:Box, public kind:string,public id:number) {
      this.box=box;
      this.buildShell()
      this.box.display.clickable.push(this.m);
      this.box.display.glScene.add(this.m);
      this.box.display.dragControls.addObject(this.m)
    }
    buildShell(){
      if(this.kind=='roomVert') {
        let g = new THREE.SphereGeometry(70,5,20)
        this.m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({color: 0x0000ff}))
      }
      if(this.kind=='midpoint') {
        let g = new THREE.SphereGeometry(30)
        this.m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: 0xff0000}))
      }
      this.m.userData=this;
    }
    setPosition(v:THREE.Vector3){
      this.m.position.copy(v)
      if(this.toolTip!=null){this.toolTip.update()}
    }
    makeRoomVert(){
      this.destroy()
      this.kind='roomVert';
      this.buildShell();
      this.box.display.clickable.push(this.m);
      this.box.display.glScene.add(this.m);
      this.box.display.dragControls.addObject(this.m)
    }
    setToolTip(x){
      if(this.toolTip==null){
        this.toolTip=new toolTip(this.box.display)
      }
      this.toolTip.setText(x)
      this.toolTip.setVector(this.m.position)
      this.toolTip.update()
    }
    dragStart(){
    }
    drag(e:THREE.Vector3){
      this.m.position.setX(e.x);
      this.m.position.setZ(e.z);
      if(this.toolTip!=null){this.toolTip.update()}
      this.box.markerUpdated(this,false)
    }
    dragEnd(){
      this.box.markerUpdated(this,true)
    }
    destroy(){
      if(this.toolTip!=null){this.toolTip.destroy()}
      this.box.display.clickable = this.box.display.clickable.filter(i=>i!=this.m)
      this.box.display.dragControls.delObject(this.m);
      this.box.display.glScene.remove(this.m)
    }

}
