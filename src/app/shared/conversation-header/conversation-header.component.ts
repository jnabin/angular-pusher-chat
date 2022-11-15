import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-conversation-header',
  templateUrl: './conversation-header.component.html',
  styleUrls: ['./conversation-header.component.css']
})
export class ConversationHeaderComponent implements OnInit {
  @Input() chatTitle: string = '';
  constructor() { }

  ngOnInit(): void {
  }

}
