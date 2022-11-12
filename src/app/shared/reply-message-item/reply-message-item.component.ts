import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-reply-message-item',
  templateUrl: './reply-message-item.component.html',
  styleUrls: ['./reply-message-item.component.css']
})
export class ReplyMessageItemComponent implements OnInit {
  @Input() message: any;
  @Output() scrollTo: EventEmitter<any> = new EventEmitter();
  
  constructor() { }

  ngOnInit(): void {
  }

}
