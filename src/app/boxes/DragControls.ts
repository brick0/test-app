
//import * as THREE from 'three';

declare var THREE:any
export class DragControls {
  _plane = new THREE.Plane();
  _raycaster = new THREE.Raycaster();

  _mouse = new THREE.Vector2();
  _offset = new THREE.Vector3();
  _intersection = new THREE.Vector3();
  _hovered=null;
  _selected = null;
  enabled = false;
  //
  private _objects: THREE.Object3D[]=[];
  _otherCtrlsState=[]
  constructor(private _camera: any, private _domElement: any,private _otherCtrls:any[],
  ) {

    this._otherCtrlsState=_otherCtrls.map(c=>c.enabled)
  }
  addObject(o){
    this._objects.push(o)
    if(!this.enabled){
      this.activate()
      this.enabled=true;
    }
  }
  delObject(o){
    this._objects=this._objects.filter(i=>o!=i);
    if(this._objects.length==0){
      this.deactivate()
      this.enabled=false
    }
  }
  activate() {

    this._domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    this._domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
    this._domElement.addEventListener('mouseup', this.onDocumentMouseCancel, false);
    this._domElement.addEventListener('mouseleave', this.onDocumentMouseCancel, false);
    this._domElement.addEventListener('touchmove', this.onDocumentTouchMove, false);
    this._domElement.addEventListener('touchstart', this.onDocumentTouchStart, false);
    this._domElement.addEventListener('touchend', this.onDocumentTouchEnd, false);
  }

  deactivate() {

    this._domElement.removeEventListener('mousemove', this.onDocumentMouseMove, false);
    this._domElement.removeEventListener('mousedown', this.onDocumentMouseDown, false);
    this._domElement.removeEventListener('mouseup', this.onDocumentMouseCancel, false);
    this._domElement.removeEventListener('mouseleave', this.onDocumentMouseCancel, false);
    this._domElement.removeEventListener('touchmove', this.onDocumentTouchMove, false);
    this._domElement.removeEventListener('touchstart', this.onDocumentTouchStart, false);
    this._domElement.removeEventListener('touchend', this.onDocumentTouchEnd, false);

  }

  onDocumentMouseMove =(event)=> {

    event.preventDefault();

    var rect = this._domElement.getBoundingClientRect();

    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    if (this._selected && this.enabled) {
      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        this._selected.userData.drag(this._intersection.sub(this._offset))
      }
      return;
    }
    let intersects = this._raycaster.intersectObjects( this._objects );
		if ( intersects.length > 0 ) {
      if(this._hovered==null) {
        this._domElement.style.cursor = 'pointer';
        this._hovered = intersects[0].object
      }
    }
    else{
		  if(this._hovered!=null) {
         this._hovered=null;
        this._domElement.style.cursor = 'auto';
      }
    }
  }

  onDocumentMouseDown =(event)=> {
    event.preventDefault();

    this._raycaster.setFromCamera(this._mouse, this._camera);

    var intersects = this._raycaster.intersectObjects(this._objects);

    if (intersects.length > 0) {
      this._plane.setFromNormalAndCoplanarPoint(
        this._camera.getWorldDirection(this._plane.normal), intersects[0].object.position);
      this._selected = intersects[0].object;
      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        let x=this._selected.parent.localToWorld(this._selected.position.clone())
        this._offset.copy(this._intersection).sub(x)
       }
      this._domElement.style.cursor = 'move';
      this.saveOtherStateAndDisable()
      this._selected.userData.dragStart()
    }
  }
  saveOtherStateAndDisable(){
    this._otherCtrls.forEach((c,i)=>{
        this._otherCtrlsState[i]=c.enabled;
        c.enabled=false;
      })
  }
  restoreOtherState(){
    this._otherCtrls.forEach((c,i)=>{
      c.enabled=this._otherCtrlsState[i]
    })
  }

  onDocumentMouseCancel =(event)=>{
    event.preventDefault();
    if (this._selected) {
      this.restoreOtherState()
      this._selected.userData.dragEnd()
      this._selected = null;
      this._offset=new THREE.Vector3()

    }
    this._domElement.style.cursor = 'auto';
  }



  onDocumentTouchMove=(event)=> {
    event.preventDefault();
    event = event.changedTouches[0];
    var rect = this._domElement.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this._camera);
    if (this._selected && this.enabled) {
      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        this._selected.userData.drag(this._intersection.sub(this._offset))
      }
      return;
    }

  }

  onDocumentTouchStart =(event) =>{

    event.preventDefault();
    event = event.changedTouches[0];

    var rect = this._domElement.getBoundingClientRect();

    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._camera);

    var intersects = this._raycaster.intersectObjects(this._objects);

    if (intersects.length > 0) {

      this._selected = intersects[0].object;

      this._plane.setFromNormalAndCoplanarPoint(this._camera.getWorldDirection(this._plane.normal), this._selected.position);
      if (this._raycaster.ray.intersectPlane(this._plane, this._intersection)) {
        this._offset.copy(this._intersection).sub(this._selected.position);
      }
      this._domElement.style.cursor = 'move';
      this.saveOtherStateAndDisable()
      this._selected.userData.dragStart()
    }

  }



  onDocumentTouchEnd =(event) =>{
    event.preventDefault();
    if (this._selected) {
      this.restoreOtherState()
      this._selected.userData.dragEnd()
      this._selected = null;
    }

    this._domElement.style.cursor = 'auto';

  }


}
