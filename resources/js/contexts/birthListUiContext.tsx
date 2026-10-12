import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePage } from "@inertiajs/react";

export type BirthListOption = {
  id: number;
  name: string;
  items_count?: number;
  product_ids?: number[];
};

export type BirthListToastProduct = {
  id: number;
  name: string;
  slug?: string;
  price?: number;
  image_url?: string | null;
};

export type BirthListToastItem = {
  id: number;
  quantity: number;
  status?: string;
  product: BirthListToastProduct | null;
};

export type BirthListToast = {
  list_id: number;
  list_name: string;
  items_count: number;
  product: BirthListToastProduct | null;
  items: BirthListToastItem[];
};

type BirthListUiContextValue = {
  lists: BirthListOption[];
  totalItems: number;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  activeListId: number | null;
  openSheet: (listId?: number | null) => void;
  toast: BirthListToast | null;
  toastVisible: boolean;
  setToastVisible: (v: boolean) => void;
  showToast: (payload: BirthListToast) => void;
  createOpen: boolean;
  createProductId: number | null;
  openCreateDialog: (productId?: number | null) => void;
  setCreateOpen: (open: boolean) => void;
  pendingProductId: number | null;
  setPendingProductId: (id: number | null) => void;
  isProductInList: (productId: number) => boolean;
  markProductInList: (productId: number) => void;
};

const BirthListUiContext = createContext<BirthListUiContextValue | null>(null);

export function useBirthListUi() {
  const ctx = useContext(BirthListUiContext);
  if (!ctx) {
    throw new Error("useBirthListUi must be used within BirthListUiProvider");
  }
  return ctx;
}

/** Safe hook when provider may be missing (e.g. admin pages). */
export function useBirthListUiOptional() {
  return useContext(BirthListUiContext);
}

export function BirthListUiProvider({ children }: { children: ReactNode }) {
  const page = usePage<{
    birthLists?: BirthListOption[];
    flash?: { birth_list_toast?: BirthListToast | null };
  }>();

  const lists = page.props.birthLists ?? [];
  const flashToast = page.props.flash?.birth_list_toast ?? null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const [toast, setToast] = useState<BirthListToast | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createProductId, setCreateProductId] = useState<number | null>(null);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [localAddedIds, setLocalAddedIds] = useState<number[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFlashKey = useRef<string | null>(null);

  const totalItems = useMemo(
    () => lists.reduce((sum, l) => sum + (l.items_count ?? 0), 0),
    [lists],
  );

  const listedProductIds = useMemo(() => {
    const ids = new Set<number>(localAddedIds);
    for (const list of lists) {
      for (const id of list.product_ids ?? []) {
        ids.add(id);
      }
    }
    return ids;
  }, [lists, localAddedIds]);

  const isProductInList = useCallback(
    (productId: number) => listedProductIds.has(productId),
    [listedProductIds],
  );

  const markProductInList = useCallback((productId: number) => {
    setLocalAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  }, []);

  const showToast = useCallback((payload: BirthListToast) => {
    setToast(payload);
    setActiveListId(payload.list_id);
    if (payload.product?.id) {
      setLocalAddedIds((prev) =>
        prev.includes(payload.product!.id) ? prev : [...prev, payload.product!.id],
      );
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000);
  }, []);

  useEffect(() => {
    if (!flashToast?.list_id) return;
    const key = `${flashToast.list_id}-${flashToast.product?.id ?? "x"}-${flashToast.items_count}`;
    if (lastFlashKey.current === key) return;
    lastFlashKey.current = key;
    showToast(flashToast);
  }, [flashToast, showToast]);

  const openSheet = useCallback((listId?: number | null) => {
    const id = listId ?? activeListId ?? lists[0]?.id ?? null;
    if (id) setActiveListId(id);
    setSheetOpen(true);
    setToastVisible(false);
  }, [activeListId, lists]);

  const openCreateDialog = useCallback((productId?: number | null) => {
    setCreateProductId(productId ?? null);
    setCreateOpen(true);
  }, []);

  const value: BirthListUiContextValue = {
    lists,
    totalItems,
    sheetOpen,
    setSheetOpen,
    activeListId,
    openSheet,
    toast,
    toastVisible,
    setToastVisible,
    showToast,
    createOpen,
    createProductId,
    openCreateDialog,
    setCreateOpen,
    pendingProductId,
    setPendingProductId,
    isProductInList,
    markProductInList,
  };

  return (
    <BirthListUiContext.Provider value={value}>{children}</BirthListUiContext.Provider>
  );
}
