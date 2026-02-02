import useBaseUrl from "@docusaurus/useBaseUrl";
import useLayoutEffect from "@docusaurus/useIsomorphicLayoutEffect";

export default function Home() {
  const docsIntroUrl = useBaseUrl("/docs/intro");

  useLayoutEffect(() => {
    window.location.replace(docsIntroUrl);
  }, [docsIntroUrl]);

  return null;
}
