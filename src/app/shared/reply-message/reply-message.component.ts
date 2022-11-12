import { outputAst } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-reply-message',
  templateUrl: './reply-message.component.html',
  styleUrls: ['./reply-message.component.css']
})
export class ReplyMessageComponent implements OnInit {

  @Input() replyUserName: string = '';
  @Input() replyMessage: string = '';
  @Input() title: string = '';

  @Output() cancel: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
