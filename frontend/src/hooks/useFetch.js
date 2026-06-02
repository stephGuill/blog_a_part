import { useEffect, useState } from "react";

export function useFetch(fetcher, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, dependencies);

  return { data, error, isLoading };
}
