import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import "./enableThreeExamples";
import "three/examples/js/renderers/CSS3DRenderer"
import "three/examples/js/controls/OrbitControls"

import { ThreeDisplay,  Rack} from "../boxes/boxes"

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
  ctxCanvas2D = document.createElement("canvas").getContext("2d");
  rack:Rack;
  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 5000;
    this.rack=new Rack(this,1,'test12',null,true);
    this.rack.label='this is a simpler test'
    this.rack.isRoot=true
    this.rack.rotateY(45)
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

  }

   ngAfterViewInit() {
        this.createRender(this.rendererContainer)
        this.render();
    }

    render = ()=> {
        window.requestAnimationFrame(()=>this.render());
        //this.mesh.rotation.x += 0.01;
        //this.mesh.rotation.y += 0.02;
        //this.rack.rotateY(2);
        this.glRenderer.render(this.glScene, this.camera);
        this.cssRenderer.render(this.cssScene, this.camera)
    }

}


