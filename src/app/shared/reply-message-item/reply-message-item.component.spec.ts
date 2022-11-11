import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplyMessageItemComponent } from './reply-message-item.component';

describe('ReplyMessageItemComponent', () => {
  let component: ReplyMessageItemComponent;
  let fixture: ComponentFixture<ReplyMessageItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplyMessageItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplyMessageItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
