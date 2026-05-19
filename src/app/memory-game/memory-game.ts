import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';

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
  cardIcons = ['🦊', '🐰', '🦁', '🐸', '🐵', '🦉', '🐝', '🦖'];
  cards: Card[] = [];
  flippedCards: Card[] = [];
  lockBoard = true; 
  moves = 0;
  matches = 0;

  // 🔥 MODIFICATO: Tempo iniziale portato a 120 secondi
  readonly INITIAL_TIME = 120; 
  timeLeft = signal(this.INITIAL_TIME);
  timerInterval: any = null;

  gameStarted = false;
  gameWon = false;
  
  victoryStats: Stats | null = null;
  // Variabile per memorizzare il miglior punteggio di sempre
  bestStats: Stats | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.prepareDeck(); 
    this.loadBestStats(); // Carica il record precedente all'avvio
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
    this.loadBestStats(); // Rinfresca il record visivo
    
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

        // 🔥 SALVATAGGIO DEL RECORD
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

  // 🔥 Metodo per salvare le statistiche e verificare se è un nuovo record
  saveStats(currentStats: Stats) {
    const saved = localStorage.getItem('memory_best_stats');
    
    if (!saved) {
      // Se non esiste nessun record, questo è il primo e diventa il migliore
      localStorage.setItem('memory_best_stats', JSON.stringify(currentStats));
    } else {
      const oldBest: Stats = JSON.parse(saved);
      // È un nuovo record se ha fatto meno mosse, o a parità di mosse se ci ha messo meno tempo
      if (currentStats.moves < oldBest.moves || (currentStats.moves === oldBest.moves && currentStats.timeSpent < oldBest.timeSpent)) {
        localStorage.setItem('memory_best_stats', JSON.stringify(currentStats));
      }
    }
    this.loadBestStats();
  }

  // 🔥 Metodo per leggere il record dal browser
  loadBestStats() {
    const saved = localStorage.getItem('memory_best_stats');
    if (saved) {
      this.bestStats = JSON.parse(saved);
    }
  }
}