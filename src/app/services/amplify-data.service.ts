import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { type Schema } from '../../../amplify/data/resource';
import { BehaviorSubject } from 'rxjs';
import { NoteI } from '../interfaces/notes';
import { LabelI } from '../interfaces/labels';
import { db } from '../db/db';

@Injectable({
    providedIn: 'root'
})
export class AmplifyDataService {
    private client = generateClient<Schema>();

    private notesSubject = new BehaviorSubject<NoteI[]>([]);
    public notes$ = this.notesSubject.asObservable();

    private labelsSubject = new BehaviorSubject<LabelI[]>([]);
    public labels$ = this.labelsSubject.asObservable();

    private isAmplifyConnected = false;
    private connectionChecked = false;

    private authStatusSubject = new BehaviorSubject<boolean>(false);
    public authStatus$ = this.authStatusSubject.asObservable();

    constructor() {
        this.initializeConnection();
    }

    private async initializeConnection() {
        await this.checkAmplifyConfiguration();
        if (this.isAmplifyConnected) {
            this.initSubscriptions();
        }
    }

    private async checkAmplifyConfiguration() {
        try {
            // Try to get current user session to verify Amplify is properly configured
            const user = await getCurrentUser();
            const session = await fetchAuthSession();

            if (user && session.tokens) {
                console.log('AWS Amplify connected successfully');
                this.isAmplifyConnected = true;
                this.authStatusSubject.next(true);
            } else {
                console.log('User not authenticated, using local storage');
                this.isAmplifyConnected = false;
                this.authStatusSubject.next(false);
                await this.loadFromLocalStorage();
                await this.loadLabelsFromLocalStorage();
            }
        } catch (error: any) {
            // Check if it's just a "not authenticated" error vs actual config issue
            if (error?.name === 'UserUnAuthenticatedException' ||
                error?.message?.includes('not authenticated')) {
                console.log('User not logged in, using local storage mode');
                this.isAmplifyConnected = false;
            } else {
                console.log('Amplify not configured or error:', error?.message || error);
                this.isAmplifyConnected = false;
            }
            this.authStatusSubject.next(false);
            await this.loadFromLocalStorage();
            await this.loadLabelsFromLocalStorage();
        }
        this.connectionChecked = true;
    }

    /**
     * Re-initialize after user logs in
     */
    public async onUserLogin() {
        this.isAmplifyConnected = true;
        this.authStatusSubject.next(true);
        this.initSubscriptions();
    }

    /**
     * Switch to local storage after user logs out
     */
    public async onUserLogout() {
        this.isAmplifyConnected = false;
        this.authStatusSubject.next(false);
        await this.loadFromLocalStorage();
        await this.loadLabelsFromLocalStorage();
    }

    private initSubscriptions() {
        if (!this.isAmplifyConnected) return;

        // Subscribe to Notes
        this.client.models.Note.observeQuery().subscribe({
            next: (data: any) => {
                const notes = data.items.map((item: any) => ({
                    id: item.id,
                    noteTitle: item.noteTitle || '',
                    noteBody: item.noteBody || '',
                    pinned: item.pinned || false,
                    bgColor: item.bgColor || '#ffffff',
                    bgImage: item.bgImage || '',
                    checkBoxes: this.parseJsonField(item.checkBoxes, []),
                    isCbox: item.isCbox || false,
                    labels: this.parseJsonField(item.labels, []),
                    archived: item.archived || false,
                    trashed: item.trashed || false,
                    images: this.parseJsonField(item.images, []),
                })) as NoteI[];
                this.notesSubject.next(notes);
            },
            error: (err: any) => {
                console.error('Error observing notes:', err);
                this.fallbackToLocalStorage();
            }
        });

        // Subscribe to Labels
        this.client.models.Label.observeQuery().subscribe({
            next: (data: any) => {
                const labels = data.items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    color: item.color || '#5f6368',
                })) as LabelI[];
                this.labelsSubject.next(labels);
            },
            error: (err: any) => {
                console.error('Error observing labels:', err);
                this.fallbackToLocalStorage();
            }
        });
    }

    private async fallbackToLocalStorage() {
        console.log('Falling back to local storage');
        this.isAmplifyConnected = false;
        this.authStatusSubject.next(false);
        await this.loadFromLocalStorage();
        await this.loadLabelsFromLocalStorage();
    }

    private async loadFromLocalStorage() {
        try {
            const notes = await db.notes.toArray();
            this.notesSubject.next(notes as unknown as NoteI[]);
        } catch (error) {
            console.error('Error loading notes from local storage', error);
        }
    }

    private async loadLabelsFromLocalStorage() {
        try {
            const labels = await db.labels.toArray();
            this.labelsSubject.next(labels as unknown as LabelI[]);
        } catch (error) {
            console.error('Error loading labels from local storage', error);
        }
    }

    // ==================== NOTE OPERATIONS ====================

    async addNote(note: NoteI): Promise<{ data: { id: string } | null }> {
        if (this.isAmplifyConnected) {
            try {
                const { id, ...noteData } = note;
                const result = await this.client.models.Note.create({
                    noteTitle: noteData.noteTitle,
                    noteBody: noteData.noteBody || '',
                    pinned: noteData.pinned || false,
                    bgColor: noteData.bgColor || '#ffffff',
                    bgImage: noteData.bgImage || '',
                    checkBoxes: this.stringifyJsonField(noteData.checkBoxes),
                    isCbox: noteData.isCbox || false,
                    labels: this.stringifyJsonField(noteData.labels),
                    archived: noteData.archived || false,
                    trashed: noteData.trashed || false,
                    images: this.stringifyJsonField(noteData.images),
                } as any);
                return { data: { id: result.data?.id || '' } };
            } catch (error) {
                console.error('Failed to add note to cloud:', error);
                return await this.addNoteToLocalStorage(note);
            }
        } else {
            return await this.addNoteToLocalStorage(note);
        }
    }

    private async addNoteToLocalStorage(note: NoteI): Promise<{ data: { id: string } }> {
        try {
            const id = await db.notes.add(note as any);
            await this.loadFromLocalStorage();
            return { data: { id: id.toString() } };
        } catch (error) {
            console.error('Error adding note to local storage', error);
            throw error;
        }
    }

    async updateNote(note: NoteI): Promise<{ data: any }> {
        if (!note.id) return { data: null };

        if (this.isAmplifyConnected) {
            try {
                const result = await this.client.models.Note.update({
                    id: note.id,
                    noteTitle: note.noteTitle,
                    noteBody: note.noteBody || '',
                    pinned: note.pinned || false,
                    bgColor: note.bgColor || '#ffffff',
                    bgImage: note.bgImage || '',
                    checkBoxes: this.stringifyJsonField(note.checkBoxes),
                    isCbox: note.isCbox || false,
                    labels: this.stringifyJsonField(note.labels),
                    archived: note.archived || false,
                    trashed: note.trashed || false,
                    images: this.stringifyJsonField(note.images),
                } as any);
                return { data: result.data };
            } catch (error) {
                console.error('Failed to update note in cloud:', error);
                return await this.updateNoteInLocalStorage(note);
            }
        } else {
            return await this.updateNoteInLocalStorage(note);
        }
    }

    private async updateNoteInLocalStorage(note: NoteI): Promise<{ data: any }> {
        try {
            const numericId = parseInt(note.id as string);
            await db.notes.update(numericId, note as any);
            await this.loadFromLocalStorage();
            return { data: note };
        } catch (error) {
            console.error('Error updating note in local storage', error);
            throw error;
        }
    }

    async deleteNote(id: string): Promise<{ data: { id: string } | null }> {
        if (this.isAmplifyConnected) {
            try {
                await this.client.models.Note.delete({ id });
                return { data: { id } };
            } catch (error) {
                console.error('Failed to delete note from cloud:', error);
                return await this.deleteNoteFromLocalStorage(id);
            }
        } else {
            return await this.deleteNoteFromLocalStorage(id);
        }
    }

    private async deleteNoteFromLocalStorage(id: string): Promise<{ data: { id: string } }> {
        try {
            const numericId = parseInt(id);
            await db.notes.delete(numericId);
            await this.loadFromLocalStorage();
            return { data: { id } };
        } catch (error) {
            console.error('Error deleting note from local storage', error);
            throw error;
        }
    }

    // ==================== LABEL OPERATIONS ====================

    async addLabel(label: LabelI): Promise<{ data: { id: string } | null }> {
        if (this.isAmplifyConnected) {
            try {
                const { id, added, ...labelData } = label;
                const result = await this.client.models.Label.create({
                    name: labelData.name,
                    color: labelData.color || '#5f6368',
                } as any);
                return { data: { id: result.data?.id || '' } };
            } catch (error) {
                console.error('Failed to add label to cloud:', error);
                return await this.addLabelToLocalStorage(label);
            }
        } else {
            return await this.addLabelToLocalStorage(label);
        }
    }

    private async addLabelToLocalStorage(label: LabelI): Promise<{ data: { id: string } }> {
        try {
            const id = await db.labels.add(label as any);
            await this.loadLabelsFromLocalStorage();
            return { data: { id: id.toString() } };
        } catch (error) {
            console.error('Error adding label to local storage', error);
            throw error;
        }
    }

    async updateLabel(label: LabelI): Promise<{ data: any } | undefined> {
        if (!label.id) return;

        if (this.isAmplifyConnected) {
            try {
                const result = await this.client.models.Label.update({
                    id: label.id,
                    name: label.name,
                    color: label.color || '#5f6368',
                } as any);
                return { data: result.data };
            } catch (error) {
                console.error('Failed to update label in cloud:', error);
                return await this.updateLabelInLocalStorage(label);
            }
        } else {
            return await this.updateLabelInLocalStorage(label);
        }
    }

    private async updateLabelInLocalStorage(label: LabelI): Promise<{ data: any }> {
        try {
            const numericId = parseInt(label.id as string);
            await db.labels.update(numericId, label as any);
            await this.loadLabelsFromLocalStorage();
            return { data: label };
        } catch (error) {
            console.error('Error updating label in local storage', error);
            throw error;
        }
    }

    async deleteLabel(id: string): Promise<{ data: { id: string } | null }> {
        if (this.isAmplifyConnected) {
            try {
                await this.client.models.Label.delete({ id });
                return { data: { id } };
            } catch (error) {
                console.error('Failed to delete label from cloud:', error);
                return await this.deleteLabelFromLocalStorage(id);
            }
        } else {
            return await this.deleteLabelFromLocalStorage(id);
        }
    }

    private async deleteLabelFromLocalStorage(id: string): Promise<{ data: { id: string } }> {
        try {
            const numericId = parseInt(id);
            await db.labels.delete(numericId);
            await this.loadLabelsFromLocalStorage();
            return { data: { id } };
        } catch (error) {
            console.error('Error deleting label from local storage', error);
            throw error;
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Stringify array/object fields for AppSync AWSJSON type
     */
    private stringifyJsonField(value: any[] | undefined | null): string | null {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return null;
        }
        return JSON.stringify(value);
    }

    /**
     * Parse AWSJSON string fields back to arrays/objects
     */
    private parseJsonField<T>(value: string | T[] | undefined | null, defaultValue: T[]): T[] {
        if (!value) return defaultValue;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.error('Failed to parse JSON field:', e);
                return defaultValue;
            }
        }
        return value as T[];
    }

    public isConnectedToCloud(): boolean {
        return this.isAmplifyConnected;
    }

    public async refreshData(): Promise<void> {
        if (this.isAmplifyConnected) {
            // Cloud data refreshes automatically via subscriptions
            console.log('Data is synced with cloud');
        } else {
            await this.loadFromLocalStorage();
            await this.loadLabelsFromLocalStorage();
        }
    }
}
