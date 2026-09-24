import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeShareFragment, encodeShareFragment, toBirthPayload } from 'util/fortune';

/**
 * Computes a result from birth input and keeps the input in the URL fragment
 * so the page can be shared. The fragment is never sent to the server, and
 * nothing is stored for anonymous users.
 */
export default function useFortuneResult(computeFn) {
  const [birth, setBirth] = useState(() => decodeShareFragment(window.location.hash));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef(null);

  const compute = useCallback(async (input) => {
    try {
      setIsLoading(true);
      const res = await computeFn(toBirthPayload(input));
      setBirth(input);
      setData(res);
      window.history.replaceState(null, '', `${window.location.pathname}#${encodeShareFragment(input)}`);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [computeFn]);

  // A shared link opens straight to its result.
  useEffect(() => {
    if (birth) {
      compute(birth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { birth, data, isLoading, compute, resultRef };
}
