import { useEffect, useState } from 'react';

type FetchOptions = {
  cacheBust?: boolean;
  retryOn304?: boolean;
};

export function useFetchPortfolio<T>(url: string, options: FetchOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (__DEV__) {
          console.log(`[useFetchPortfolio] Fetching from ${url}`);
        }

        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store' as any,
        });

        if (__DEV__) {
          console.log(`[useFetchPortfolio] Response status: ${response.status}`);
        }

        // Handle 304 Not Modified by retrying with cache bust
        const finalResponse =
          response.status === 304 && options.retryOn304
            ? await fetch(`${url}?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store' as any,
              })
            : response;

        if (!finalResponse.ok) {
          throw new Error(`HTTP ${finalResponse.status}`);
        }

        const jsonData = (await finalResponse.json()) as T;

        if (!isMounted) return;

        setData(jsonData);
        setIsLoading(false);

        if (__DEV__) {
          console.log(`[useFetchPortfolio] Successfully fetched data from ${url}`);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn(`[useFetchPortfolio] Failed to fetch from ${url}:`, err);
        }

        if (!isMounted) return;

        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, options.retryOn304]);

  return { data, isLoading, error };
}
