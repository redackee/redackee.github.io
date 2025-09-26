(function(){
  // Loader that prefers a browser-friendly Vosklet build if available.
  // Place a browser build at /assets/wasm/Vosklet.browser.js (it should expose `loadVosklet`) to opt-in.
  const base = (window.siteBaseurl || '').replace(/\/$/, '');
  const browserBuild = `${base}/assets/wasm/Vosklet.browser.js`;
  const fallbackBuild = `${base}/assets/wasm/Vosklet.js`;

  async function scriptExists(url){
    try{
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    }catch(e){
      return false;
    }
  }

  function injectScript(src){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve(src);
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  (async function selectAndLoad(){
    try{
      const hasBrowser = await scriptExists(browserBuild);
      if(hasBrowser){
        console.info('Loading browser-friendly Vosklet build:', browserBuild);
        await injectScript(browserBuild);
        return;
      }
      // try fallback
      const hasFallback = await scriptExists(fallbackBuild);
      if(hasFallback){
        console.info('Loading Vosklet build:', fallbackBuild);
        await injectScript(fallbackBuild);
        return;
      }
      console.warn('No Vosklet build found at', browserBuild, 'or', fallbackBuild);
    }catch(e){
      console.error('Failed to load Vosklet build:', e);
    }
  })();
})();
