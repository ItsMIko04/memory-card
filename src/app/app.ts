import { Component, signal } from '@angular/core';
import { MemoryGame } from './memory-game/memory-game';


@Component({
  selector: 'app-root',
  imports: [ MemoryGame],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('memory-card');
}
