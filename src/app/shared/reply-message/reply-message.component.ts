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
  @Input() replyMessageUrl: string = '';
  @Input() title: string = '';
  isImage = false

  @Output() cancel: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
    this.isImage = this.isImageTypeUrl(this.replyMessageUrl);
  }

  isImageTypeUrl(url: string): boolean {
    return url != null && url.length >= 5 && 
          (
            url.slice(-5).toLowerCase().includes('.png') || 
            url.slice(-5).toLowerCase().includes('.jpg') || 
            url.slice(-5).toLowerCase().includes('.jpeg') || 
            url.slice(-5).toLowerCase().includes('.gif')
          );
  }

}
