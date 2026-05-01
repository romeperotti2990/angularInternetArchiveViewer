import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Archive } from '../../services/archive';
import { FavoritesService } from '../../services/favorites.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-2">
      <div *ngIf="loading" class="text-xs text-gray-500 italic flex items-center mb-2">
        <span class="animate-pulse mr-2">●</span> Loading file list...
      </div>
      <div *ngIf="error" class="text-xs text-red-500 mb-2">{{ error }}</div>

      <ul *ngIf="files.length" class="space-y-1 bg-white/50 rounded-lg border border-gray-100 divide-y divide-gray-50 max-h-80 overflow-y-auto custom-scrollbar">
        <li *ngFor="let file of files" class="p-2 hover:bg-blue-50/50 transition-colors">
          <div class="flex flex-wrap items-center gap-2">
            <a
              href="#"
              (click)="onOpenFile($event, file.name)"
              class="text-blue-600 hover:text-blue-800 font-medium truncate flex-1 min-w-37.5 text-xs"
            >
              {{ file.name }}
            </a>
            
            <div class="flex items-center gap-2 text-[10px]">
              <span class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 uppercase">{{ file.format }}</span>
              <span class="text-gray-500">{{ file.size ? formatBytes(file.size) : '' }}</span>
              
              <button
                type="button"
                class="text-sm p-1 hover:bg-gray-100 rounded transition-colors"
                [title]="favorites.isFavorited(identifier + '::' + file.name) ? 'Unfavorite' : 'Favorite'"
                (click)="$event.stopPropagation(); toggleFavorite(file)"
              >
                {{ favorites.isFavorited(identifier + '::' + file.name) ? '★' : '☆' }}
              </button>
              
              <a
                [href]="archive.getFileUrl(identifier, file.name)"
                download
                class="text-blue-600 hover:underline"
              >
                Download
              </a>

              <button
                *ngIf="isEmulatorFile(file.name) && !isArchiveFile(file.name)"
                class="px-1.5 py-0.5 rounded bg-green-600 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-green-700"
                type="button"
                (click)="onOpenInEmulator(file.name)"
              >
                Emulator
              </button>

              <button
                *ngIf="isArchiveFile(file.name)"
                class="px-1.5 py-0.5 rounded bg-yellow-600 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-yellow-700"
                type="button"
                (click)="toggleArchive(file.name)"
              >
                {{ archiveVisible[identifier + '::' + file.name] ? 'Hide' : 'Peek' }}
              </button>
            </div>
          </div>

          <!-- Archive contents -->
          <div *ngIf="archiveVisible[identifier + '::' + file.name] || archiveLoading[identifier + '::' + file.name]" 
               class="mt-2 ml-4 border-l-2 border-yellow-400 pl-2 pb-2 bg-yellow-50/30 rounded-r">
            <div *ngIf="archiveLoading[identifier + '::' + file.name]" class="text-[10px] text-gray-500 italic">
              Listing archive contents... ({{ archiveProgress[identifier + '::' + file.name] }}%)
            </div>
            <div *ngIf="archiveError[identifier + '::' + file.name]" class="text-[10px] text-red-500">{{ archiveError[identifier + '::' + file.name] }}</div>
            
            <ul *ngIf="archiveVisible[identifier + '::' + file.name] && archiveContents[identifier + '::' + file.name]?.length" class="space-y-1 mt-1">
              <li *ngFor="let entry of archiveContents[identifier + '::' + file.name]" class="flex items-center gap-2 text-[11px]">
                <span class="truncate flex-1 text-gray-700">{{ entry.name }}</span>
                
                <button
                  type="button"
                  class="text-xs p-0.5 hover:bg-gray-100 rounded transition-colors"
                  [title]="favorites.isFavorited(identifier + '::' + file.name + '::' + entry.name) ? 'Unfavorite' : 'Favorite'"
                  (click)="$event.stopPropagation(); toggleArchiveEntryFavorite(file.name, entry)"
                >
                  {{ favorites.isFavorited(identifier + '::' + file.name + '::' + entry.name) ? '★' : '☆' }}
                </button>

                <button
                  *ngIf="isEmulatorFile(entry.name)"
                  class="px-1 py-0.5 rounded bg-green-600 text-white text-[8px] font-bold uppercase hover:bg-green-700"
                  (click)="onPlayArchiveEntry(file.name, entry)"
                >
                  Play
                </button>
                <button
                  *ngIf="!isEmulatorFile(entry.name)"
                  class="px-1 py-0.5 rounded bg-blue-600 text-white text-[8px] font-bold uppercase hover:bg-blue-700"
                  (click)="onPlayArchiveEntry(file.name, entry)"
                >
                  Open
                </button>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class FilesComponent {
  @Input() identifier: string = '';
  @Input() collectionTitle: string = '';
  @Input() collectionDescription: string = '';
  @Input() files: any[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() fileOpened = new EventEmitter<{filename: string}>();
  @Output() emulatorOpened = new EventEmitter<{filename: string}>();

  archiveContents: Record<string, any[]> = {};
  archiveVisible: Record<string, boolean> = {};
  archiveLoading: Record<string, boolean> = {};
  archiveError: Record<string, string | null> = {};
  archiveProgress: Record<string, number> = {};

  constructor(
    public archive: Archive,
    public favorites: FavoritesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  isEmulatorFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['gba', 'gbc', 'gb', 'nes', 'snes', 'gen', 'md', 'sms', 'gg', 'n64', 'z64', 'v64', 'nds', 'iso', 'img', 'pbp', 'cue', 'bin'].includes(ext);
  }

  isArchiveFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['zip', '7z', 'rar', 'tar', 'gz'].includes(ext);
  }

  onOpenFile(event: Event, filename: string) {
    event.preventDefault();
    this.fileOpened.emit({ filename });
  }

  onOpenInEmulator(filename: string) {
    this.emulatorOpened.emit({ filename });
  }

  toggleFavorite(file: any) {
    this.favorites.toggle(this.identifier + '::' + file.name, {
      label: file.name,
      mode: this.archive.getModeForFilename(file.name),
      core: this.isEmulatorFile(file.name) ? this.archive.getEmulatorCore(file.name) : null,
      url: this.archive.getFileUrl(this.identifier, file.name),
      identifier: this.identifier,
      collectionTitle: this.collectionTitle,
      collectionDescription: this.collectionDescription,
      ts: 0
    });
  }

  toggleArchiveEntryFavorite(archiveName: string, entry: any) {
    const key = this.identifier + '::' + archiveName + '::' + entry.name;
    this.favorites.toggle(key, {
      label: entry.name,
      mode: this.archive.getModeForFilename(entry.name),
      core: this.isEmulatorFile(entry.name) ? this.archive.getEmulatorCore(entry.name) : null,
      url: this.archive.getFileUrl(this.identifier, archiveName),
      identifier: this.identifier,
      collectionTitle: this.collectionTitle,
      collectionDescription: this.collectionDescription,
      ts: 0
    });
  }

  async toggleArchive(filename: string) {
    const key = this.identifier + '::' + filename;
    if (this.archiveContents[key]) {
      this.archiveVisible[key] = !this.archiveVisible[key];
      return;
    }

    this.archiveLoading[key] = true;
    this.archiveError[key] = null;
    this.archiveProgress[key] = 0;

    try {
      const entries = await this.archive.listArchiveContents(this.identifier, filename, (p: number) => {
        this.archiveProgress[key] = Math.floor(p);
        this.cdr.detectChanges();
      });
      this.archiveContents[key] = entries || [];
      this.archiveVisible[key] = true;
    } catch (err: any) {
      this.archiveError[key] = err?.message || String(err);
    } finally {
      this.archiveLoading[key] = false;
      this.cdr.detectChanges();
    }
  }

  async onPlayArchiveEntry(archiveName: string, entryObj: any) {
    try {
      if (!entryObj.entry || entryObj.entry.metadataOnly) {
        this.fileOpened.emit({ filename: entryObj.name });
        return;
      }

      const blob = await this.archive.extractFileFromArchive(entryObj.entry);
      const url = URL.createObjectURL(blob);
      const mode = this.archive.getModeForFilename(entryObj.name);
      const qp: any = { 
        mode, 
        displayLabel: entryObj.name, 
        identifier: this.identifier,
        collectionTitle: this.collectionTitle,
        collectionDescription: this.collectionDescription
      };
      
      if (mode === 'emulator') {
        qp.core = this.archive.getEmulatorCore(entryObj.name);
        qp.gameUrl = url;
      } else {
        qp.mediaUrl = url;
      }
      
      this.router.navigate(['/media'], { queryParams: qp });
    } catch (err: any) {
      this.archiveError[this.identifier + '::' + archiveName] = err?.message || String(err);
      this.cdr.detectChanges();
    }
  }
}
