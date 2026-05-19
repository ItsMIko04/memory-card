// 1. Aggiungi gli import 'PLATFORM_ID' e 'inject' da @angular/core, e 'isPlatformBrowser' da @angular/common
import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Stats {
  moves: number;
  timeSpent: number;
}

@Component({
  selector: 'app-memory-game',
  standalone: true,
  imports: [],
  templateUrl: './memory-game.html',
  styleUrls: ['./memory-game.css']
})
export class MemoryGame implements OnInit, OnDestroy {
  // 2. Recuperiamo l'identificativo della piattaforma (Server o Browser)
  private platformId = inject(PLATFORM_ID);

  cardIcons = ['🦊', '🐰', '🦁', '🐸', '🐵', '🦉', '🐝', '🦖'];
  cards: Card[] = [];
  flippedCards: Card[] = [];
  lockBoard = true; 
  moves = 0;
  matches = 0;

  readonly INITIAL_TIME = 120; 
  timeLeft = signal(this.INITIAL_TIME);
  timerInterval: any = null;

  gameStarted = false;
  gameWon = false;
  
  victoryStats: Stats | null = null;
  bestStats: Stats | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.prepareDeck(); 
    this.loadBestStats(); 
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
    this.loadBestStats(); 
    
    this.timeLeft.set(this.INITIAL_TIME);
    this.moves = 0;
    this.matches = 0;
    this.flippedCards = [];
    this.victoryStats = null; 
    this.gameWon = false;
    
    this.lockBoard = false;
    this.gameStarted = true;

    this.startTimer();
    this.cdr.detectChanges();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(time => time - 1);
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
    this.cdr.detectChanges();
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

        this.saveStats(this.victoryStats);
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

  // 3. MODIFICATO: Controlla se siamo nel browser prima di salvare
  saveStats(currentStats: Stats) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('memory_best_stats');
      
      if (!saved) {
        localStorage.setItem('memory_best_stats', JSON.stringify(currentStats));
      } else {
        const oldBest: Stats = JSON.parse(saved);
        if (currentStats.moves < oldBest.moves || (currentStats.moves === oldBest.moves && currentStats.timeSpent < oldBest.timeSpent)) {
          localStorage.setItem('memory_best_stats', JSON.stringify(currentStats));
        }
      }
      this.loadBestStats();
    }
  }

  // 4. MODIFICATO: Controlla se siamo nel browser prima di leggere
  loadBestStats() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('memory_best_stats');
      if (saved) {
        this.bestStats = JSON.parse(saved);
      }
    }
  }
}