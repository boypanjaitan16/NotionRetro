import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Collection {
	id: string;
	name: string;
	description: string;
	items: CollectionItem[];
}

interface CollectionItem {
	id: string;
	content: string;
	status: string;
	notionPageId?: string;
}

interface CollectionState {
	collections: Collection[];
	selectedCollection: Collection | null;
	isLoading: boolean;
	error: string | null;
}

interface CollectionActions {
	setCollections: (collections: Collection[]) => void;
	addCollection: (collection: Collection) => void;
	updateCollection: (id: string, updates: Partial<Collection>) => void;
	deleteCollection: (id: string) => void;
	setSelectedCollection: (collection: Collection | null) => void;
	addItem: (collectionId: string, item: CollectionItem) => void;
	updateItem: (
		collectionId: string,
		itemId: string,
		updates: Partial<CollectionItem>,
	) => void;
	deleteItem: (collectionId: string, itemId: string) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
}

export const useCollectionStore = create<CollectionState & CollectionActions>()(
	immer((set) => ({
		// Initial state
		collections: [],
		selectedCollection: null,
		isLoading: false,
		error: null,

		// Collection actions
		setCollections: (collections) =>
			set((state) => {
				state.collections = collections;
			}),

		addCollection: (collection) =>
			set((state) => {
				state.collections.push(collection);
			}),

		updateCollection: (id, updates) =>
			set((state) => {
				const index = state.collections.findIndex((c) => c.id === id);
				if (index !== -1) {
					Object.assign(state.collections[index], updates);

					// Update selected collection if it's the one being updated
					if (state.selectedCollection?.id === id) {
						state.selectedCollection = { ...state.collections[index] };
					}
				}
			}),

		deleteCollection: (id) =>
			set((state) => {
				state.collections = state.collections.filter((c) => c.id !== id);

				// Clear selected collection if it's the one being deleted
				if (state.selectedCollection?.id === id) {
					state.selectedCollection = null;
				}
			}),

		setSelectedCollection: (collection) =>
			set((state) => {
				state.selectedCollection = collection;
			}),

		// Item actions
		addItem: (collectionId, item) =>
			set((state) => {
				const collection = state.collections.find((c) => c.id === collectionId);
				if (collection) {
					collection.items.push(item);

					// Update selected collection if it's the one being modified
					if (state.selectedCollection?.id === collectionId) {
						state.selectedCollection = { ...collection };
					}
				}
			}),

		updateItem: (collectionId, itemId, updates) =>
			set((state) => {
				const collection = state.collections.find((c) => c.id === collectionId);
				if (collection) {
					const itemIndex = collection.items.findIndex((i) => i.id === itemId);
					if (itemIndex !== -1) {
						Object.assign(collection.items[itemIndex], updates);

						// Update selected collection if it's the one being modified
						if (state.selectedCollection?.id === collectionId) {
							state.selectedCollection = { ...collection };
						}
					}
				}
			}),

		deleteItem: (collectionId, itemId) =>
			set((state) => {
				const collection = state.collections.find((c) => c.id === collectionId);
				if (collection) {
					collection.items = collection.items.filter((i) => i.id !== itemId);

					// Update selected collection if it's the one being modified
					if (state.selectedCollection?.id === collectionId) {
						state.selectedCollection = { ...collection };
					}
				}
			}),

		// UI state actions
		setLoading: (isLoading) =>
			set((state) => {
				state.isLoading = isLoading;
			}),

		setError: (error) =>
			set((state) => {
				state.error = error;
			}),
	})),
);
