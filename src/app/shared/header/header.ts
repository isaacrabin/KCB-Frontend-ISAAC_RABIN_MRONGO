import { Component, Output, EventEmitter, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @Input() userName = signal('Administrator');
  @Input() userRole = signal('System Admin');
  @Output() logout = new EventEmitter<void>();

  userInitials = computed(() => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  });

  onLogout() {
    this.logout.emit();
  }
}
