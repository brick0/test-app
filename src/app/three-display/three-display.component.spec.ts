import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeDisplayComponent } from './three-display.component';

describe('ThreeDisplayComponent', () => {
  let component: ThreeDisplayComponent;
  let fixture: ComponentFixture<ThreeDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreeDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreeDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
