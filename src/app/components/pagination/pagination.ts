import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() totalResults = 0;
  @Input() showPageSizeSelector = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageInput = '1';

  ngOnChanges() {
    this.pageInput = String(this.page || 1);
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil((this.totalResults || 0) / this.pageSize));
  }

  prev() {
    const next = Math.max(1, (this.page || 1) - 1);
    this.setPage(next);
  }

  next() {
    const maxPage = Math.max(1, Math.ceil((this.totalResults || 0) / this.pageSize));
    const next = Math.min(maxPage, (this.page || 1) + 1);
    this.setPage(next);
  }

  setPageFromInput() {
    const maxPage = Math.max(1, Math.ceil((this.totalResults || 0) / this.pageSize));
    const v = parseInt(this.pageInput, 10);
    if (!isNaN(v) && v >= 1 && v <= maxPage) {
      this.setPage(v);
    } else {
      // reset to current page
      this.pageInput = String(this.page || 1);
    }
  }

  setPage(n: number) {
    if (n === this.page) return;
    this.page = n;
    this.pageInput = String(n);
    this.pageChange.emit(n);
  }

  onPageSizeChange(e: Event) {
    const v = parseInt((e.target as HTMLSelectElement).value, 10);
    if (!isNaN(v)) {
      this.pageSizeChange.emit(v);
      this.setPage(1);
      this.pageInput = '1';
    }
  }
}
