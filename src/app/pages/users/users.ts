// users.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements OnInit {
  private userService = inject(UserService);

  // State
  users = signal<User[]>([]);
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';
  sortKey = 'name';
  sortDir = 1;
  currentPage = 1;
  pageSize = 6;

  // Modal states
  showUserModal = false;
  showViewModal = false;
  showDeleteModal = false;
  isEditing = false;
  selectedUser: User | null = null;
  userToDelete: User | null = null;
  formData: Partial<User> = {};

  // Current user info
  currentUserName = signal('Administrator');
  currentUserRole = signal('System Admin');

  columns = [
    { key: 'name', label: 'User' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'lastLogin', label: 'Last Login' }
  ];

  statsCards = computed(() => {
    const users = this.users();
    return [
      { 
        label: 'Total Users', 
        value: users.length, 
        subLabel: 'All registered users', 
        color: 'var(--kcb-primary)', 
        bgColor: 'rgba(0,61,76,0.07)', 
        icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75' 
      },
      { 
        label: 'Active', 
        value: users.filter(u => u.status === 'active').length, 
        subLabel: 'Currently active', 
        color: 'var(--kcb-success)', 
        bgColor: 'rgba(0,184,148,0.08)', 
        icon: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01 9 11.01' 
      },
      { 
        label: 'Pending', 
        value: users.filter(u => u.status === 'pending').length, 
        subLabel: 'Awaiting activation', 
        color: 'var(--kcb-warning)', 
        bgColor: 'rgba(243,156,18,0.08)', 
        icon: 'M12 22a10 10 0 110-20 10 10 0 010 20z M12 6v6l4 2' 
      },
      { 
        label: 'Admins', 
        value: users.filter(u => u.role === 'admin').length, 
        subLabel: 'Admin role users', 
        color: 'var(--kcb-accent-dark)', 
        bgColor: 'rgba(124,193,66,0.1)', 
        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' 
      }
    ];
  });

  filteredUsers = computed(() => {
    let result = [...this.users()];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        `${u.name} ${u.email} ${u.username}`.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      result = result.filter(u => u.status === this.statusFilter);
    }

    // Role filter
    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string, bVal: string;
      if (this.sortKey === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      } else if (this.sortKey === 'department') {
        aVal = a.department || '';
        bVal = b.department || '';
      } else if (this.sortKey === 'role') {
        aVal = a.role || '';
        bVal = b.role || '';
      } else if (this.sortKey === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      } else {
        aVal = a[this.sortKey as keyof User] as string || '';
        bVal = b[this.sortKey as keyof User] as string || '';
      }
      return aVal.localeCompare(bVal) * this.sortDir;
    });

    return result;
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize));
  startIndex = computed(() => (this.currentPage - 1) * this.pageSize);
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.filteredUsers().length));

  paginatedUsers = computed(() => {
    const start = this.startIndex();
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }
    return pages;
  });

  ngOnInit() {
    this.loadUsers();
    this.loadCurrentUser();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        // Add default fields for mock data
        const enrichedUsers = users.map(user => ({
          ...user,
          role: user.role || 'viewer',
          status: user.status || 'active',
          department: user.department || 'General',
          lastLogin: user.lastLogin || new Date().toISOString().split('T')[0],
          createdAt: user.createdAt || new Date().toISOString().split('T')[0]
        }));
        this.users.set(enrichedUsers);
      },
      error: (err) => this.showToast('error', 'Failed to load users: ' + err.message)
    });
  }

  loadCurrentUser() {
    const token = sessionStorage.getItem('kcb_token');
    if (token) {
      // You can decode token or get user info from somewhere else
      this.currentUserName.set('Administrator');
      this.currentUserRole.set('System Admin');
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortDir *= -1;
    } else {
      this.sortKey = key;
      this.sortDir = 1;
    }
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page === -1) return;
    this.currentPage = page;
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  openAddModal() {
    this.isEditing = false;
    this.formData = { 
      name: '', 
      username: '', 
      email: '', 
      phone: '',
      role: 'viewer', 
      status: 'pending', 
      department: '' 
    };
    this.showUserModal = true;
  }

  openEditModal(user: User) {
    this.isEditing = true;
    this.formData = { ...user };
    this.showUserModal = true;
    this.closeViewModal();
  }

  openViewModal(user: User) {
    this.selectedUser = user;
    this.showViewModal = true;
  }

  openDeleteConfirm(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  saveUser() {
    if (!this.formData.name || !this.formData.username || !this.formData.email) {
      this.showToast('error', 'Please fill all required fields');
      return;
    }

    const request = this.isEditing
      ? this.userService.updateUser(this.formData.id!, this.formData)
      : this.userService.createUser(this.formData);

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.closeUserModal();
        this.showToast('success', `User ${this.isEditing ? 'updated' : 'created'} successfully`);
      },
      error: (err) => this.showToast('error', err.message)
    });
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.loadUsers();
          this.closeDeleteModal();
          this.showToast('success', 'User deleted successfully');
        },
        error: (err) => this.showToast('error', 'Failed to delete user: ' + err.message)
      });
    }
  }

  editFromView() {
    if (this.selectedUser) {
      this.openEditModal(this.selectedUser);
    }
  }

  exportUsers() {
    const users = this.filteredUsers();
    const csvRows = [
      ['ID', 'Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Department', 'Last Login', 'Created']
    ];
    
    users.forEach(u => {
      csvRows.push([
        u.id.toString(),
        `"${u.name}"`,
        u.username,
        u.email,
        u.phone || '',
        u.role || '',
        u.status || '',
        u.department || '',
        u.lastLogin || '',
        u.createdAt || ''
      ]);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `kcb-users-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.showToast('success', `Exported ${users.length} users as CSV`);
  }

  onLogout() {
    sessionStorage.removeItem('kcb_token');
    sessionStorage.removeItem('kcb_user');
    window.location.href = '/login';
  }

  closeUserModal() { 
    this.showUserModal = false; 
    this.formData = {};
  }
  
  closeViewModal() { 
    this.showViewModal = false; 
    this.selectedUser = null; 
  }
  
  closeDeleteModal() { 
    this.showDeleteModal = false; 
    this.userToDelete = null; 
  }

  closeModalOnBackdrop(event: MouseEvent, modalType: string) {
    if ((event.target as HTMLElement).classList.contains('bg-black/45')) {
      if (modalType === 'user') this.closeUserModal();
      if (modalType === 'view') this.closeViewModal();
      if (modalType === 'delete') this.closeDeleteModal();
    }
  }

  getNameInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(id: number): string {
    const colors = ['#003D4C', '#005966', '#7CC142', '#5fa030', '#2e7d32', '#1565c0', '#6a1b9a', '#ad1457', '#00838f', '#ef6c00'];
    return colors[id % colors.length];
  }

  getRoleBadgeClass(role: string = 'viewer'): string {
    const classes: Record<string, string> = {
      admin: 'bg-[rgba(0,61,76,0.1)] text-[var(--kcb-primary-light)]',
      editor: 'bg-[rgba(124,193,66,0.15)] text-[#3b6b14]',
      viewer: 'bg-[rgba(107,114,128,0.1)] text-gray-600'
    };
    return classes[role] 
  }

  getStatusBadgeClass(status: string = 'pending'): string {
    const classes: Record<string, string> = {
      active: 'bg-[rgba(0,184,148,0.1)] text-[#00876e]',
      inactive: 'bg-[rgba(214,48,49,0.1)] text-[#b71c1c]',
      pending: 'bg-[rgba(243,156,18,0.12)] text-[#9a5c00]'
    };
    return classes[status] 
  }

  capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }

  showToast(type: 'success' | 'error', message: string) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 animate-slideUp ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
