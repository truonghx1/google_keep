import { LabelI } from './labels';

export interface ImageI {
    id: string
    data: string // base64 encoded image
    width?: number
    height?: number
    createdAt: number
}

export interface NoteI {
    id?: string
    noteTitle: string
    noteBody?: string
    pinned: boolean
    bgColor: string
    bgImage: string
    checkBoxes?: CheckboxI[]
    isCbox: boolean
    labels: LabelI[]
    archived: boolean
    trashed: boolean
    images?: ImageI[]
}

export interface CheckboxI {
    done: boolean,
    data: any,
    id: string
}

export type UpdateKeyI = {
    [key in keyof NoteI]?: any
}

export interface NoteModelI {
    id: string
    pinned: NoteI[]
    unpinned: NoteI[]
    all: NoteI[]
    db: {
        add(data: NoteI): Promise<string | undefined>
        update(data: NoteI): void
        updateKey(object: UpdateKeyI): void
        updateAllLabels(labelId: string, labelValue: string): void
        get(): Promise<NoteI>
        clone(): void
        delete(): void
        trash(): void
    }
}
