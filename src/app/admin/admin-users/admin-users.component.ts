import { Component, OnInit } from '@angular/core';
import { AdminUsersService, AdminUserDto } from '../services/admin-users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: AdminUserDto[] = [];
  filteredUsers: AdminUserDto[] = [];
  searchTerm = '';
  selectedRole: 'host' | 'guest' = 'host';
  editUser: AdminUserDto | null = null;
  editId='';
  editUserName = '';
  editEmail = '';
  editPhoneNumber = '';
  loading = false;
  currentPage = 1;
  itemsPerPage = 8;
  totalPages = 1;
  paginatedUsers: AdminUserDto[] = [];

  constructor(private adminUsersService: AdminUsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const obs = this.selectedRole === 'host' ? this.adminUsersService.getHosts() : this.adminUsersService.getGuests();
    obs.subscribe({
      next: users => {
        this.users = users;
        this.applySearch();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.userName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, end);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  onSearchChange(): void {
    this.applySearch();
  }

  switchRole(role: 'host' | 'guest'): void {
    this.selectedRole = role;
    this.editUser = null;
    this.loadUsers();
  }

  startEdit(user: AdminUserDto): void {
    this.editUser = { ...user };
    this.editUserName = user.userName;
    this.editEmail = user.email;
    this.editPhoneNumber = user.phoneNumber;
  }

  saveEdit(): void {
    if (!this.editUser) return;
    const userId = this.editUser.id;
    this.adminUsersService.updateUser(userId, { userName: this.editUserName, email: this.editEmail, phoneNumber: this.editPhoneNumber }).subscribe({
      next: () => {
        this.editUser = null;
        this.loadUsers();
      }
    });
  }

  cancelEdit(): void {
    this.editUser = null;
  }

  deleteUser(user: AdminUserDto): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const userId = user.id;
    this.adminUsersService.deleteUser(userId).subscribe({
      next: () => this.loadUsers()
    });
  }
}
