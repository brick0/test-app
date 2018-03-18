import * as THREE from "three";
import {Box, ThreeDisplay} from "./box";

export class Label {
  static fontSize = 14;
  static font = '14px Helvetica';
  hole=null; // we need to punch a hole in the css
  display: ThreeDisplay;
  element = document.createElement('div');
  cssText = new THREE.CSS3DObject(this.element)
  textWidth: number;
  scale:number;
  firstTime=true;
  constructor(private o: Box, private text: string, private where: string,public options?:any) {
    this.text = text;
    this.display = o.display;
    if(this.options==undefined){
      this.options={}
    }
    this.o.box.geometry.computeBoundingBox();
    this.element.style.font = Label.font;
    this.element.style.background = 'white';
    this.setLabelText(text);
    this.display.cssScene.add(this.cssText);
    this.hole.userData={"kind":"hole"};

  }

  setLabelText(text:string){
    this.element.textContent = text
    this.element.textContent=text;
    this.text=text;
    this.textWidth = this.getTextWidth(this.text);
    let geometry = new THREE.PlaneGeometry(this.textWidth, Label.fontSize);
    if(this.hole!=null){
      this.o.group.remove(this.hole)
    }
    this.hole = new THREE.Mesh(geometry,
      new THREE.MeshLambertMaterial({color: 0x000000, opacity: 0.0, side: THREE.DoubleSide}));
    if(this.where=='top-center') {
      this.hole.rotateX((-90 * Math.PI) / 180)
      if(this.firstTime){
        this.cssText.rotateX((-90 * Math.PI) / 180)
        this.firstTime=false;
      }
    }
    this.o.group.add(this.hole);
    this.setScale();
    this.setPosition();
    this.display.labelUpdates.push(this)
  }

  setPosition(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;
    if('position' in this.options){
      this.hole.position.copy(this.options.position);
    }else {
      switch (this.where) {
        case 'top-front':
          this.hole.position.copy(new THREE.Vector3(0, max.y, max.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0));
          break
        case 'top-back':
          this.hole.position.copy(new THREE.Vector3(0, max.y, min.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
          this.hole.rotateY(Math.PI)
          break
        case 'top-back':
          this.hole.position.copy(new THREE.Vector3(0, max.y, min.z))
          this.hole.position.add(new THREE.Vector3(0, Label.fontSize / 2 * this.scale, 0))
          this.hole.rotateY(Math.PI);
          break
        case 'top-left':
          this.hole.position.copy(new THREE.Vector3(min.x, max.y, 0))
          this.hole.position.add(new THREE.Vector3(Label.fontSize / 2 * this.scale, 1, 0))
          this.hole.rotateY(Math.PI / 2)
          this.hole.rotateX(-Math.PI / 2)
          break

        case 'top-right':
          this.hole.position.copy(new THREE.Vector3(max.x, max.y, 0))
          this.hole.position.add(new THREE.Vector3(-Label.fontSize / 2 * this.scale, 1, 0))
          this.hole.rotateY(-Math.PI / 2)
          this.hole.rotateX(-Math.PI / 2);
          break
        case 'top-center':
          this.hole.position.copy(new THREE.Vector3(0, max.y + 1, 0));
          break;
        case 'front':
        case 'front-vertical':
          if ('mesh' in this.options) {
            this.hole.position.copy(this.options.mesh.position).add(new THREE.Vector3(0, 0, max.z + 1))
          } else {
            this.hole.position.copy(new THREE.Vector3(0, 0, max.z + 1))
          }
          break;
        case 'back':
        case 'back-vertical':
          if ('mesh' in this.options) {
            this.hole.position.copy(this.options.mesh.position).add(new THREE.Vector3(0, 0, min.z - 1))
          } else {
            this.hole.position.copy(new THREE.Vector3(0, 0, min.z - 1))
          }
          this.hole.rotateY(Math.PI)
          break;
      }
      if(this.where.includes('vertical')){
       this.hole.rotateZ((90*Math.PI)/180)
       //this.hole.rotateY()
      }
    }
    this.cssText.position.copy(this.hole.position)
    this.o.group.localToWorld(this.cssText.position)
  }

  setScale(){
    let refObj=this.o.box;
    if('mesh' in this.options){refObj=this.options.mesh}
    let max = refObj.geometry.boundingBox.max;
    let min = refObj.geometry.boundingBox.min;
    let maxHeight=('maxHeight' in this.options)?this.options.maxHeight:max.y - min.y;
    let maxWidth=('maxWidth' in this.options)?this.options.maxWidth:max.x - min.x;
    let scaleX=Math.abs(maxWidth/this.textWidth);
    let scaleY=Math.abs(maxHeight/Label.fontSize);
    if(this.where.includes('vertical')){
      scaleX=Math.abs((maxHeight-2)/this.textWidth);
      scaleY=Math.abs((maxWidth-2)/Label.fontSize);
    }
    this.scale= (scaleX<scaleY)?scaleX:scaleY;
    this.hole.scale.set(this.scale,this.scale,1);
    this.cssText.scale.copy(this.hole.scale)
  }
  getTextWidth(text) {
    this.display.ctxCanvas2D.font = Label.font;
    return this.display.ctxCanvas2D.measureText(text).width;
  }
  boxMoved() {
    this.display.labelUpdates.push(this);
  }
  updatePosition(){ // rquires the world matrix to be updated
    this.cssText.position.copy(this.hole.position)
    this.cssText.rotation.copy(this.hole.getWorldRotation())
    this.o.group.localToWorld(this.cssText.position)
  }

  destroy(){
    this.o.group.remove(this.hole);
    this.display.cssScene.remove(this.cssText);
    this.element.remove();
  }

}
