import * as THREE from "three";

export class toolTip {
  element=document.createElement('div')
  pos:THREE.Vector3
  constructor(private display){
    this.element.style.zIndex="20";
    this.element.style.position="absolute";
    this.element.style.backgroundColor="yellow"
    this.display.toolTipRender.appendChild(this.element)
    this.display.toolTips.push(this)
  }
  setText(text:string){
    this.element.textContent=text;
  }
  setVector(v:THREE.Vector3){
    this.pos=v
  }
  update(){
    let canvas = this.display.glRenderer.domElement;
    let v=this.pos.clone()
    v.project( this.display.camera );
    let x = Math.round( (   v.x + 1 ) * canvas.width  / 2 );
    let y = Math.round( ( - v.y + 1 ) * canvas.height / 2 );
    this.element.style.left=x+'px'
    this.element.style.top=y+'px'
  }

  destroy(){
    this.element.remove();
  }
}
