import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import "./enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/OrbitControls"
import { DragControls} from "../boxes/DragControls";
import * as dat from 'dat.gui'
import {ThreeDisplay} from "../boxes/box"
import {Room} from "../boxes/room";
import {Label} from "../boxes/label";
import {Row} from "../boxes/row";
import {Rack} from "../boxes/rack";
import {RackableDevice} from "../boxes/rackable";
import {PDU} from "../boxes/pdu";

@Component({
  selector: 'app-three-display',
  templateUrl: './three-display.component.html',
  styleUrls: ['./three-display.component.css']
})

export class ThreeDisplayComponent implements  ThreeDisplay {
  @ViewChild('rendererContainer') rendererContainer: ElementRef;
  glRenderer = new THREE.WebGLRenderer({alpha: true});
  cssRenderer= new THREE.CSS3DRenderer;
  toolTipRender =  document.createElement('div')
  glScene = new THREE.Scene();
  cssScene = new THREE.Scene();
  orbitControls;
  dragControls:DragControls;
  camera = null;
  raycast = new THREE.Raycaster();
  mouse = new THREE.Vector2()
  labelUpdates:Label[]=[];
  room:Room;
  clickable:any[]=[];
  toolTips:any[]=[];
  ctxCanvas2D = document.createElement("canvas").getContext("2d");
  constructor() {


  }

  oldClickables;
  saveClickables(){
    this.oldClickables=this.clickable;
    this.clickable=[]
  }
  restoreClickables(){
    this.clickable=this.oldClickables;
  }
  createRender(domElement){
    let x= domElement.nativeElement.getBoundingClientRect()
    this.cssRenderer.setSize(x.width, x.height);
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = x.top;
    this.rendererContainer.nativeElement.appendChild(this.cssRenderer.domElement);

    this.glRenderer.setSize(x.width, x.height);
    this.glRenderer.domElement.style.zIndex = '10';
    this.glRenderer.domElement.style.position = 'absolute';
    this.glRenderer.domElement.style.top = "0px";
    this.cssRenderer.domElement.appendChild(this.glRenderer.domElement);

    this.toolTipRender.style.zIndex = '20';
    this.toolTipRender.style.position = 'absolute';
    this.toolTipRender.style.top = "0px";
    this.toolTipRender.style.left = "0px";
    this.rendererContainer.nativeElement.appendChild(this.toolTipRender);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);
    this.camera.position.z = 5000;
    this.camera.position.y = 5000;

    let light = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
    this.glScene.add(light);
    this.orbitControls = new THREE.OrbitControls(this.camera, this.cssRenderer.domElement);
    this.dragControls = new DragControls(this.camera,this.cssRenderer.domElement,
      [this.orbitControls])
    this.orbitControls.addEventListener('change', this.orbiting)
    this.glRenderer.domElement.addEventListener("mousedown", this.onMouseDown, false);
    this.glRenderer.domElement.addEventListener("mouseup", this.onMouseClick, false);

  }

   ngAfterViewInit() {
        this.createRender(this.rendererContainer)
        this.play();
        this.render();
   }
    play(){
    this.room = new Room(this, 0, "a room", null, true)

    /*let row=new Row(this, 0, "Row 01", null, false)
    this.room.addDevice(row,new THREE.Vector3(1000,0,0))
    for (let j = 0; j < 3; j++) {
      let rack = new Rack(this, 1, 'R' + j);
      row.addDevice(rack, new THREE.Vector3(j * 1000, 0, 0));
      for (let i = 1; i < 20; i++) {
        let server = new RackableDevice(this, 2, "server" + i)
        rack.addDevice(server, i, i%2==0);
        server.buildLabels()
      }
      let pdu = new PDU(this,4,'PDU R023',null,false)
      rack.addDevice(pdu,0,false)
    }
    let rack = new Rack(this, 1, 'R100' );
    this.room.addDevice(rack,new THREE.Vector3(1000,0,1000))
    for (let i = 1; i < 20; i++) {
        let server = new RackableDevice(this, 2, "server" + i)
        rack.addDevice(server, i, i%2==0);
        server.buildLabels()
      }*/
    this.room.editRoom()
    }

   orbiting=()=>{
    if(this.toolTips.length>0){
      this.toolTips.forEach(t=>t.update())
    }
    this.render()
   }

   renderScheduled=false;
   render=()=> {
      if(!this.renderScheduled){
        this.renderScheduled=true
        setTimeout(this._render,10)
      }
   }
   _render = () => {
     this.renderScheduled=false;
    if(this.labelUpdates.length>0){
      this.glScene.updateMatrixWorld(true)
      this.labelUpdates.forEach(l=>l.updatePosition());
      this.labelUpdates=[]
    }

     this.glRenderer.render(this.glScene, this.camera);
     this.cssRenderer.render(this.cssScene, this.camera)

   }
   onMouseDown = (event)=> {
     this.mouse.x = event.offsetX;
     this.mouse.y = event.offsetY;
   }
   selected:any;
   onMouseClick = (event)=> {
     if (this.mouse.x == event.offsetX && this.mouse.y == event.offsetY) {
       this.mouse.x = (event.offsetX / this.glRenderer.domElement.width) * 2 - 1
       this.mouse.y = -(event.offsetY / this.glRenderer.domElement.height) * 2 + 1
       this.raycast.setFromCamera(this.mouse, this.camera);
       let intersects = this.raycast.intersectObjects(this.clickable, false);
       let clicked = intersects.reduce((r, x) => {
         let a=x.object as any;
         if (a.material.wireframe) {
           return r
         }
         if (r && r.distance < x.distance) {
           return r
         }
         return x
       }, null)  // prefer non-wireframe objects first
       if (!clicked && intersects.length > 0) {
         clicked = intersects[0]
       }
       if (this.selected) {
           if (this.selected.userData.deselected) {
             this.selected.userData.deselected()
           }
         }
       if (clicked) {
         this.selected = clicked.object;
         if (this.selected.userData.selected) {
           this.selected.userData.selected()
         }
       }else{

       }
       this.render()
     }
   }
}


