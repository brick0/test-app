import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import "./enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/OrbitControls"
import * as dat from 'dat.gui'
import {ThreeDisplay, Rack, RackableDevice,Label,Room} from "../boxes/boxes"

@Component({
  selector: 'app-three-display',
  templateUrl: './three-display.component.html',
  styleUrls: ['./three-display.component.css']
})

export class ThreeDisplayComponent implements  ThreeDisplay {
  @ViewChild('rendererContainer') rendererContainer: ElementRef;
  glRenderer = new THREE.WebGLRenderer({alpha: true});
  cssRenderer= new THREE.CSS3DRenderer;
  glScene = new THREE.Scene();
  cssScene = new THREE.Scene();
  controls;
  camera = null;
  raycast = new THREE.Raycaster();
  mouse = new THREE.Vector2()
  labelUpdates:Label[]=[];
  room:Room;
  clickable:any[]=[];
  ctxCanvas2D = document.createElement("canvas").getContext("2d");
  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 5000;
    this.room=new Room(this,0,"a room",null,true)
    for(let j=0;j<2;j++) {
        let rack=new Rack(this,1,'R'+j);
        this.room.addDevice(rack,new THREE.Vector3(j*1000,0,0));
        rack.rotateY(25);
      for (let i = 0; i < 40; i++) {
        let server = new RackableDevice(this, 2, "server" + i)
        rack.addDevice(server, i, true);
        server.buildLabels()
      }
    }

    this.refreshLabels();
  }

  refreshLabels(){
    if(this.labelUpdates.length>0){
      this.glScene.updateMatrixWorld(true)
      this.labelUpdates.forEach(l=>l.updatePosition());
      this.labelUpdates=[]
    }
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
    this.glRenderer.domElement.style.top = "0";
    this.cssRenderer.domElement.appendChild(this.glRenderer.domElement);
    let light = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
    this.glScene.add(light);
    this.controls = new THREE.OrbitControls(this.camera, this.cssRenderer.domElement);
    this.controls.addEventListener('change', this.render)
    this.glRenderer.domElement.addEventListener("mousedown", this.onMouseDown, false);
    this.glRenderer.domElement.addEventListener("mouseup", this.onMouseClick, false);

  }

   ngAfterViewInit() {
        this.createRender(this.rendererContainer)
        this.render();
   }

   render = ()=> {
     window.requestAnimationFrame(() => this.render());
     //this.mesh.rotation.x += 0.01;
     //this.mesh.rotation.y += 0.02;
     //this.rack.rotateY(2);
     this.glRenderer.render(this.glScene, this.camera);
     this.cssRenderer.render(this.cssScene, this.camera)
   }
   onMouseDown = (event)=> {
     this.mouse.x = event.offsetX;
     this.mouse.y = event.offsetY;
   }
   selected:any;
   onMouseClick = (event)=> {
     console.log(event);
     if (this.mouse.x == event.offsetX && this.mouse.y == event.offsetY) {
       this.mouse.x = (event.offsetX / this.glRenderer.domElement.width) * 2 - 1
       this.mouse.y = -(event.offsetY / this.glRenderer.domElement.height) * 2 + 1
       this.raycast.setFromCamera(this.mouse, this.camera);
       let intersects = this.raycast.intersectObjects(this.clickable, false);
       console.log(intersects);
       let clicked = intersects.reduce((r, x) => {
         if (x.object.material.wireframe) {
           return r
         }
         if (r && r.distance < x.distance) {
           return r
         }
         return x
       }, null);
       if (!clicked && intersects.length > 0) {
         clicked = intersects[0]
       }
       if (clicked) {
         if (this.selected) {
           if (this.selected.userData.deselected) {
             this.selected.userData.deselected()
           }
         }
         this.selected = clicked.object;
         if (this.selected.userData.selected) {
           this.selected.userData.selected()
         }
       }
       this.render()
     }
   }
}


