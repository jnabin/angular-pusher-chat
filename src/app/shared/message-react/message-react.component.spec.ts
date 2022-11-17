import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageReactComponent } from './message-react.component';

describe('MessageReactComponent', () => {
  let component: MessageReactComponent;
  let fixture: ComponentFixture<MessageReactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageReactComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageReactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
