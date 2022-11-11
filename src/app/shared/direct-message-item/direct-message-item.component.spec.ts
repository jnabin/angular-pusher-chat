import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectMessageItemComponent } from './direct-message-item.component';

describe('DirectMessageItemComponent', () => {
  let component: DirectMessageItemComponent;
  let fixture: ComponentFixture<DirectMessageItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectMessageItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectMessageItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
