import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-conversation-header',
  templateUrl: './conversation-header.component.html',
  styleUrls: ['./conversation-header.component.css']
})
export class ConversationHeaderComponent implements OnInit {
  @Input() chatTitle: string = '';

  @Output() back:EventEmitter<any> = new EventEmitter<any>()
  constructor() { }

  ngOnInit(): void {
  }

}
