import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-direct-message-item',
  templateUrl: './direct-message-item.component.html',
  styleUrls: ['./direct-message-item.component.css']
})
export class DirectMessageItemComponent implements OnInit {
  @Input() message:any;
  @Input() i:any;
  @Input() messages:any;
  @Input() fromConversation:any;

  @Output() replayProcess: EventEmitter<any> = new EventEmitter();
  @Output() reactMessage: EventEmitter<any> = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

  addEmoji(c: any){

  }

}
