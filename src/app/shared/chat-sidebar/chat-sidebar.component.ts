import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-chat-sidebar',
  templateUrl: './chat-sidebar.component.html',
  styleUrls: ['./chat-sidebar.component.css']
})
export class ChatSidebarComponent implements OnInit, OnChanges {

  @Input() conversationItem?: any;
  @Input() isSelected: boolean = false;
  @Input() isActive: boolean = false;
  @Input() openUserId!: number;
  @Input() activeUserIds: string[] = [];

  @Output() openSessionClick: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.activeUserIds);
  }

  ngOnInit(): void {
  }

  openSession(){
    this.openSessionClick.emit(this.conversationItem.id);
  }

  getIsActive(id: number) {
    console.log(id);
    console.log(this.activeUserIds.includes(id.toString()));
    return this.activeUserIds.includes(id.toString());
  }

}
