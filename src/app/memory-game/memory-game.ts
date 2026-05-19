import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

@Component({
  selector: 'app-memory-game',
  standalone: true,
  imports: [],
  templateUrl: './memory-game.html',
  styleUrls: ['./memory-game.css']
})
export class MemoryGame implements OnInit, OnDestroy {
  cardIcons = ['🦊', '🐰', '🦁', '🐸', '🐵', '🦉', '🐝', '🦖'];
  cards: Card[] = [];
  flippedCards: Card[] = [];
  lockBoard = true; 
  moves = 0;
  matches = 0;

  readonly INITIAL_TIME = 60; 
  timeLeft = signal(this.INITIAL_TIME);
  timerInterval: any = null;

  gameStarted = false;
  gameWon = false;
  victoryStats: { moves: number; timeSpent: number } | null = null;

  // Iniettiamo ChangeDetectorRef nel costruttore
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.prepareDeck(); 
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  prepareDeck() {
    const deck = [...this.cardIcons, ...this.cardIcons];
    this.cards = deck
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        value: icon,
        isFlipped: false,
        isMatched: false
      }));
  }

  startGame() {
    this.stopTimer(); 
    this.prepareDeck();
    
    this.timeLeft.set(this.INITIAL_TIME);
    this.moves = 0;
    this.matches = 0;
    this.flippedCards = [];
    this.victoryStats = null; 
    this.gameWon = false;
    
    this.lockBoard = false;
    this.gameStarted = true;

    this.startTimer();
    this.cdr.detectChanges(); // Aggiornamento iniziale dello schermo
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      // Sottrae 1 al contatore
      this.timeLeft.update(time => time - 1);

      // 🔥 FORZATURA: Dice ad Angular di aggiornare l'HTML ADESSO
      this.cdr.detectChanges(); 

      if (this.timeLeft() <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  gameOver() {
    this.stopTimer();
    this.lockBoard = true;
    this.gameStarted = false;
    this.cdr.detectChanges();
    
    alert('⏰ TEMPO SCADUTO! Il gioco ricomincerà da capo!');
    this.startGame(); 
  }

  cardClicked(card: Card) {
    if (!this.gameStarted || this.lockBoard || card.isFlipped || card.isMatched) {
      return;
    }

    card.isFlipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.checkMatch();
    }
    this.cdr.detectChanges(); // Aggiorna i click visivamente
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;

    if (card1.value === card2.value) {
      card1.isMatched = true;
      card2.isMatched = true;
      this.matches++;
      this.flippedCards = [];
      
      if (this.matches === this.cardIcons.length) {
        this.stopTimer(); 
        this.lockBoard = true;
        this.gameWon = true; 
        
        const timeSpent = this.INITIAL_TIME - this.timeLeft();
        
        this.victoryStats = {
          moves: this.moves,
          timeSpent: timeSpent
        };
      }
      this.cdr.detectChanges();
    } else {
      this.lockBoard = true;
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = [];
        this.lockBoard = false;
        this.cdr.detectChanges();
      }, 1000);
    }
  }
}