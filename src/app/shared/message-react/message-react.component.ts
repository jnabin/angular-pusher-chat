import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-react',
  templateUrl: './message-react.component.html',
  styleUrls: ['./message-react.component.css']
})
export class MessageReactComponent implements OnInit {
  @Input() react: any;
  constructor() { }

  ngOnInit(): void {
  }

}
