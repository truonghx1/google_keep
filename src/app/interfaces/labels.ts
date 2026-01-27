export interface LabelI {
    id?: string
    name: string
    added?: boolean
    color?: string  // Label color for sidebar display
}

export type LabelActionsT = {
    update: (data: string) => void
    delete: () => void
}

export type UpdateKeyI = {
    [key in keyof LabelI]?: any
}

export interface LabelModelI {
    id: string
    list: LabelI[]
    db: {
        add(data: LabelI): Promise<any>
        update(data: UpdateKeyI): void
        delete(): void
        updateAllLabels(value: string): void
    }
}