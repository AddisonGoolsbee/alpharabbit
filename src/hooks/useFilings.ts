import { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { app } from "../firebase";
import type { FilingsSeed, Filing } from "../types/filing";

type UseFilingsResult = {
  data: FilingsSeed | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useFilings(): UseFilingsResult {
  const [data, setData] = useState<FilingsSeed | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getFirestore(app);
      const colRef = collection(db, "13f_filings");
      const snap: QuerySnapshot<DocumentData> = await getDocs(colRef);
      const result: FilingsSeed = {};

      snap.forEach((doc) => {
        const raw = doc.data() as Filing;
        result[doc.id] = raw;
      });

      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    refresh: fetchAll,
  };
}

export default useFilings;
